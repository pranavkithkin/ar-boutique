-- Campaigns use the same percentage / fixed fils / free delivery semantics as coupons.
-- Private tables and RPCs: public pages receive a deliberately limited server projection.
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '', terms text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','disabled')),
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed_fils','free_shipping')),
  discount_value integer NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('all','products','categories')),
  product_ids uuid[] NOT NULL DEFAULT '{}', category_ids uuid[] NOT NULL DEFAULT '{}',
  min_order_fils integer NOT NULL DEFAULT 0 CHECK (min_order_fils >= 0),
  max_discount_fils integer CHECK (max_discount_fils > 0),
  usage_limit integer CHECK (usage_limit > 0), per_customer_limit integer CHECK (per_customer_limit > 0),
  starts_at timestamptz, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at),
  CHECK (discount_type <> 'percentage' OR discount_value BETWEEN 1 AND 100),
  CHECK (discount_type <> 'fixed_fils' OR discount_value > 0),
  CHECK (scope <> 'products' OR cardinality(product_ids) > 0),
  CHECK (scope <> 'categories' OR cardinality(category_ids) > 0)
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offers FROM anon, authenticated;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.orders ADD COLUMN offer_id uuid REFERENCES public.offers(id), ADD COLUMN offer_snapshot jsonb;
ALTER TABLE public.orders ADD COLUMN offer_payment_note text;
ALTER TABLE public.order_items ADD COLUMN discount_fils integer NOT NULL DEFAULT 0 CHECK (discount_fils >= 0 AND discount_fils <= total_fils);

CREATE TABLE public.offer_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), offer_id uuid NOT NULL REFERENCES public.offers(id),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id), customer_email text NOT NULL,
  state text NOT NULL CHECK (state IN ('reserved','redeemed','released')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX offer_redemptions_limits ON public.offer_redemptions(offer_id, customer_email, state);
ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offer_redemptions FROM anon, authenticated;
GRANT ALL ON public.offer_redemptions TO service_role;

-- Only the server invokes this with catalogue-derived lines. Money stays in integer fils.
CREATE FUNCTION public.evaluate_offer(p_slug text, p_lines jsonb, p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  campaign public.offers%ROWTYPE; line jsonb; eligible bigint := 0; subtotal bigint := 0;
  discount bigint := 0; delivery integer; config public.settings%ROWTYPE;
BEGIN
  SELECT * INTO campaign FROM public.offers WHERE slug=p_slug FOR UPDATE;
  IF NOT FOUND OR campaign.status<>'published' OR campaign.starts_at>now() OR campaign.expires_at<=now() THEN
    RAISE EXCEPTION 'This offer is not currently available.';
  END IF;
  IF campaign.usage_limit IS NOT NULL AND (SELECT count(*) FROM public.offer_redemptions
    WHERE offer_id=campaign.id AND state IN ('reserved','redeemed')) >= campaign.usage_limit THEN
    RAISE EXCEPTION 'This offer has reached its usage limit.';
  END IF;
  IF p_email IS NOT NULL AND campaign.per_customer_limit IS NOT NULL AND (SELECT count(*) FROM public.offer_redemptions
    WHERE offer_id=campaign.id AND lower(customer_email)=lower(trim(p_email)) AND state IN ('reserved','redeemed')) >= campaign.per_customer_limit THEN
    RAISE EXCEPTION 'You have already reached the limit for this offer.';
  END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
    subtotal := subtotal+(line->>'unit_price_fils')::bigint*(line->>'quantity')::integer;
    IF campaign.scope='all' OR (line->>'product_id')::uuid=ANY(campaign.product_ids) AND campaign.scope='products'
      OR (line->>'category_id')::uuid=ANY(campaign.category_ids) AND campaign.scope='categories' THEN
      eligible := eligible+(line->>'unit_price_fils')::bigint*(line->>'quantity')::integer;
    END IF;
  END LOOP;
  IF eligible=0 THEN RAISE EXCEPTION 'Add an eligible item to use this offer.'; END IF;
  IF eligible<campaign.min_order_fils THEN RAISE EXCEPTION 'The eligible items do not meet the minimum spend for this offer.'; END IF;
  IF campaign.discount_type='percentage' THEN discount := round(eligible*campaign.discount_value/100.0);
  ELSIF campaign.discount_type='fixed_fils' THEN discount := LEAST(eligible,campaign.discount_value); END IF;
  IF campaign.max_discount_fils IS NOT NULL THEN discount := LEAST(discount,campaign.max_discount_fils); END IF;
  discount := LEAST(discount,eligible);
  SELECT * INTO STRICT config FROM public.settings WHERE id=true;
  delivery := CASE WHEN subtotal>=config.free_delivery_threshold_fils OR campaign.discount_type='free_shipping' THEN 0 ELSE config.delivery_fee_fils END;
  RETURN jsonb_build_object('offer_id',campaign.id,'title',campaign.title,'subtotal_fils',subtotal,
    'eligible_fils',eligible,'discount_fils',discount,'delivery_fee_fils',delivery,
    'free_shipping',campaign.discount_type='free_shipping');
END $$;

-- Preview never trusts prices or product/category IDs supplied by a browser.
CREATE FUNCTION public.quote_offer(p_slug text,p_items jsonb,p_email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE lines jsonb; expected integer;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid bag.'; END IF;
  expected := jsonb_array_length(p_items);
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE (x->>'quantity') IS NULL OR (x->>'quantity') !~ '^[1-5]$') THEN RAISE EXCEPTION 'Invalid quantity.'; END IF;
  IF (SELECT count(DISTINCT x->>'variant_id') FROM jsonb_array_elements(p_items) x)<>expected THEN RAISE EXCEPTION 'Duplicate bag item.'; END IF;
  SELECT jsonb_agg(jsonb_build_object('product_id',p.id,'category_id',p.category_id,
    'unit_price_fils',v.price_fils,'quantity',x->>'quantity')) INTO lines
    FROM jsonb_array_elements(p_items) x JOIN public.product_variants v ON v.id=(x->>'variant_id')::uuid
    JOIN public.products p ON p.id=v.product_id JOIN public.product_colours pc ON pc.id=v.product_colour_id
    WHERE v.is_active AND pc.is_active AND p.status='published';
  IF lines IS NULL OR jsonb_array_length(lines)<>expected THEN RAISE EXCEPTION 'An item is no longer available.'; END IF;
  RETURN public.evaluate_offer(p_slug,lines,p_email);
END $$;

-- Release/commit usage whenever the existing order flows change state, including COD cancellation.
CREATE FUNCTION public.sync_offer_redemption() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.offer_id IS NOT NULL THEN
    UPDATE public.offer_redemptions SET state=CASE
      WHEN NEW.payment_method='card' AND NEW.payment_status IN ('paid','refunded') THEN 'redeemed'
      WHEN NEW.status='cancelled' OR NEW.payment_status='failed' THEN 'released'
      WHEN NEW.payment_method='cod' THEN 'redeemed' ELSE 'reserved' END WHERE order_id=NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sync_offer_redemption AFTER UPDATE OF status,payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_offer_redemption();

-- Safe, replayable cleanup when Stripe definitively rejects session creation.
CREATE FUNCTION public.cancel_offer_checkout(p_order_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE ord public.orders%ROWTYPE; item record;
BEGIN
  SELECT * INTO ord FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR ord.offer_id IS NULL OR ord.payment_method<>'card' OR ord.status<>'pending' OR ord.payment_status<>'pending' OR ord.stock_released_at IS NOT NULL THEN RETURN; END IF;
  FOR item IN SELECT variant_id,quantity FROM public.order_items WHERE order_id=ord.id ORDER BY variant_id LOOP
    PERFORM public.release_reserved_stock(item.variant_id,item.quantity);
  END LOOP;
  UPDATE public.orders SET status='cancelled',cancelled_at=now(),stock_released_at=now(),offer_payment_note=NULL,updated_at=now() WHERE id=ord.id;
END $$;

REVOKE ALL ON FUNCTION public.evaluate_offer(text,jsonb,text),public.quote_offer(text,jsonb,text),public.cancel_offer_checkout(uuid),public.sync_offer_redemption() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_offer(text,jsonb,text),public.quote_offer(text,jsonb,text),public.cancel_offer_checkout(uuid),public.sync_offer_redemption() TO service_role;
CREATE OR REPLACE FUNCTION public.place_store_order(
  p_key uuid, p_customer jsonb, p_items jsonb, p_user_id text, p_coupon_code text DEFAULT NULL, p_offer_slug text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
<<cod_checkout>>
DECLARE
  prior public.orders%ROWTYPE;
  config public.settings%ROWTYPE;
  coupon public.coupons%ROWTYPE;
  offer_quote jsonb;
  campaign public.offers%ROWTYPE;
  eligible_running bigint := 0;
  allocated bigint := 0;
  line_discount integer := 0;
  method text := COALESCE(p_customer->>'paymentMethod','cod');
  line jsonb;
  item record;
  lines jsonb := '[]';
  request_hash text;
  new_id uuid := gen_random_uuid();
  new_number text;
  subtotal bigint := 0;
  delivery bigint := 0;
  discount bigint := 0;
  total bigint;
  quantity integer;
  redemptions integer;
  customer_email text := lower(trim(p_customer->>'email'));
  customer_phone text := regexp_replace(p_customer->>'phone','[^0-9]','','g');
BEGIN
  IF p_key IS NULL OR customer_email IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid checkout request' USING ERRCODE='P0001';
  END IF;
  IF method NOT IN ('card','cod') THEN RAISE EXCEPTION 'Invalid payment method.'; END IF;
  IF p_offer_slug IS NOT NULL AND NULLIF(trim(p_coupon_code),'') IS NOT NULL THEN RAISE EXCEPTION 'Offers cannot be combined with promo codes.'; END IF;
  request_hash := md5((jsonb_build_object('customer',p_customer-'checkoutOrigin','items',p_items,'user',p_user_id,'coupon',p_coupon_code)
    || CASE WHEN p_offer_slug IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('offer',p_offer_slug) END)::text);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
  SELECT * INTO prior FROM public.orders WHERE checkout_key=p_key;
  IF FOUND THEN
    IF prior.checkout_request_hash IS DISTINCT FROM request_hash THEN
      RAISE EXCEPTION 'Checkout details changed. Please start a new checkout.';
    END IF;
    IF prior.status='cancelled' OR prior.payment_status='failed' THEN RAISE EXCEPTION 'This checkout has expired. Start a new checkout.'; END IF;
    RETURN jsonb_build_object('order_id',prior.id,'order_number',prior.order_number,'created',false);
  END IF;

  SELECT * INTO config FROM public.settings WHERE id=true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Store settings are unavailable.'; END IF;
  IF method='card' AND COALESCE(config.notification_emails,'{}') @> ARRAY['card_disabled'] THEN RAISE EXCEPTION 'Card payments are unavailable.'; END IF;
  IF method='cod' THEN
  IF NOT config.cod_enabled THEN RAISE EXCEPTION 'Cash on delivery is unavailable.'; END IF;
  IF config.cod_signed_in_only AND p_user_id IS NULL THEN RAISE EXCEPTION 'Please sign in to use cash on delivery.'; END IF;
  -- Serialize eligibility checks across concurrent attempts for the same customer.
  PERFORM pg_advisory_xact_lock(hashtextextended('cod-email:'||customer_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended('cod-phone:'||customer_phone,0));
  IF p_user_id IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('cod-user:'||p_user_id,0)); END IF;
  IF EXISTS(SELECT 1 FROM public.customers c WHERE c.cod_disabled AND
    (lower(c.email)=customer_email OR c.clerk_user_id=p_user_id OR regexp_replace(c.phone,'[^0-9]','','g')=customer_phone)) THEN
    RAISE EXCEPTION 'Cash on delivery is restricted for this customer.';
  END IF;
  IF (SELECT count(*) FROM public.orders o WHERE o.payment_method='cod' AND o.status='returned_to_sender'
      AND (lower(o.email)=customer_email OR o.clerk_user_id=p_user_id OR regexp_replace(o.phone,'[^0-9]','','g')=customer_phone)) >= COALESCE(config.cod_refusal_limit,2) THEN
    RAISE EXCEPTION 'Cash on delivery is restricted due to delivery refusals.';
  END IF;

  END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF (line->>'quantity') IS NULL OR (line->>'quantity') !~ '^[1-5]$' THEN RAISE EXCEPTION 'Invalid item quantity.'; END IF;
    quantity := (line->>'quantity')::integer;
    SELECT v.id,v.product_id,v.product_colour_id,v.sku,v.price_fils,p.name,p.is_final_sale,p.category_id,
      pc.style_code,c.name AS colour_name,s.label AS size_label,
      (SELECT pi.media_key FROM public.product_images pi WHERE pi.product_colour_id=pc.id ORDER BY pi.sort,pi.id LIMIT 1) AS media_key
      INTO item FROM public.product_variants v
      JOIN public.products p ON p.id=v.product_id
      JOIN public.product_colours pc ON pc.id=v.product_colour_id
      JOIN public.colours c ON c.id=pc.colour_id
      LEFT JOIN public.sizes s ON s.id=v.size_id
      WHERE ((NULLIF(line->>'variant_id','') IS NOT NULL AND v.id=(line->>'variant_id')::uuid)
        OR (NULLIF(line->>'variant_id','') IS NULL AND lower(v.sku)=lower(line->>'sku')))
        AND v.is_active AND pc.is_active AND p.status='published'
      FOR SHARE OF v,p,pc;
    IF NOT FOUND OR item.price_fils IS NULL THEN RAISE EXCEPTION 'An item is no longer available. Please update your bag.'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(lines) x WHERE x->>'variant_id'=item.id::text) THEN
      RAISE EXCEPTION 'Duplicate item in checkout. Please update your bag.';
    END IF;
    lines := lines || jsonb_build_array(jsonb_build_object('variant_id',item.id,'product_id',item.product_id,
      'product_colour_id',item.product_colour_id,'category_id',item.category_id,'sku',item.sku,'unit_price_fils',item.price_fils,
      'product_name',item.name,'colour_name',item.colour_name,'style_code',item.style_code,
      'size_label',item.size_label,'quantity',quantity,'is_final_sale',item.is_final_sale,'media_key',item.media_key));
    subtotal := subtotal + item.price_fils::bigint*quantity;
  END LOOP;
  delivery := CASE WHEN subtotal >= config.free_delivery_threshold_fils THEN 0 ELSE config.delivery_fee_fils END;
  IF NULLIF(trim(p_coupon_code),'') IS NOT NULL THEN
    SELECT * INTO coupon FROM public.coupons WHERE lower(code)=lower(trim(p_coupon_code)) FOR UPDATE;
    IF NOT FOUND OR NOT coupon.is_active OR coupon.starts_at>now() OR coupon.expires_at<now()
      OR (coupon.usage_limit IS NOT NULL AND coupon.usage_count>=coupon.usage_limit)
      OR subtotal<coupon.min_order_fils THEN RAISE EXCEPTION 'Promo code is no longer available.'; END IF;
    SELECT count(*) INTO redemptions FROM public.coupon_redemptions cr WHERE cr.coupon_id=coupon.id AND lower(cr.customer_email)=cod_checkout.customer_email;
    IF redemptions>=coupon.per_customer_limit THEN RAISE EXCEPTION 'You have already used this promo code.'; END IF;
    IF coupon.discount_type='percentage' THEN
      discount := round(subtotal*coupon.discount_value/100);
      IF coupon.max_discount_fils>0 THEN discount := LEAST(discount,coupon.max_discount_fils); END IF;
    ELSIF coupon.discount_type='fixed_fils' THEN discount := LEAST(coupon.discount_value,subtotal);
    ELSIF coupon.discount_type='free_shipping' THEN delivery := 0;
    END IF;
  END IF;
  IF p_offer_slug IS NOT NULL THEN
    offer_quote := public.evaluate_offer(p_offer_slug,lines,customer_email);
    SELECT * INTO campaign FROM public.offers WHERE id=(offer_quote->>'offer_id')::uuid;
    discount := (offer_quote->>'discount_fils')::bigint;
    delivery := (offer_quote->>'delivery_fee_fils')::integer;
  END IF;
  total := GREATEST(0,subtotal-discount)+delivery+CASE WHEN method='cod' THEN config.cod_fee_fils ELSE 0 END;
  IF method='cod' AND total>config.cod_max_order_fils THEN RAISE EXCEPTION 'Order exceeds the cash on delivery limit.'; END IF;

  FOR line IN SELECT value FROM jsonb_array_elements(lines) ORDER BY value->>'variant_id' LOOP
    UPDATE public.stock_levels SET reserved=reserved+(line->>'quantity')::integer,updated_at=now()
      WHERE variant_id=(line->>'variant_id')::uuid AND on_hand-reserved >= (line->>'quantity')::integer;
    IF NOT FOUND THEN RAISE EXCEPTION 'An item is no longer available in the requested quantity.'; END IF;
  END LOOP;
  new_number := public.next_order_number();
  INSERT INTO public.orders(id,order_number,checkout_key,checkout_request_hash,clerk_user_id,email,customer_name,phone,
    emirate,area,street_address,building,apartment,landmark,internal_notes,status,payment_method,payment_status,
    subtotal_fils,discount_fils,delivery_fee_fils,cod_fee_fils,vat_fils,total_fils,vat_rate_bps,confirm_by,hold_expires_at,offer_id,offer_snapshot)
  VALUES(new_id,new_number,p_key,request_hash,p_user_id,customer_email,p_customer->>'fullName',p_customer->>'phone',
    p_customer->>'emirate',p_customer->>'area',p_customer->>'street',p_customer->>'building',p_customer->>'apartment',
    p_customer->>'landmark',NULLIF(p_customer->>'instructions',''),'pending',method,'pending',subtotal,discount,delivery,
    CASE WHEN method='cod' THEN config.cod_fee_fils ELSE 0 END,CASE WHEN config.vat_enabled THEN round(total::numeric*config.vat_rate_bps/(10000+config.vat_rate_bps)) ELSE 0 END,
    total,CASE WHEN config.vat_enabled THEN config.vat_rate_bps ELSE 0 END,CASE WHEN method='cod' THEN now()+make_interval(hours=>COALESCE(config.cod_confirm_hours,24)) END,
    CASE WHEN method='card' THEN now()+interval '31 minutes' END,campaign.id,
    CASE WHEN campaign.id IS NOT NULL THEN (to_jsonb(campaign)-'product_ids'-'category_ids') || jsonb_build_object('checkout_origin',p_customer->>'checkoutOrigin') END);
  INSERT INTO public.order_items(order_id,variant_id,product_id,product_colour_id,sku,product_name,colour_name,
    style_code,size_label,unit_price_fils,quantity,total_fils,is_final_sale,media_key)
    SELECT new_id,(x->>'variant_id')::uuid,(x->>'product_id')::uuid,(x->>'product_colour_id')::uuid,x->>'sku',x->>'product_name',
      x->>'colour_name',x->>'style_code',x->>'size_label',(x->>'unit_price_fils')::integer,(x->>'quantity')::integer,
      (x->>'unit_price_fils')::integer*(x->>'quantity')::integer,(x->>'is_final_sale')::boolean,x->>'media_key' FROM jsonb_array_elements(lines) x;
  IF campaign.id IS NOT NULL THEN
    -- Cumulative proportional allocation keeps exact fils, even for mixed carts.
    FOR line IN SELECT value FROM jsonb_array_elements(lines) ORDER BY value->>'variant_id' LOOP
      IF campaign.scope='all' OR campaign.scope='products' AND (line->>'product_id')::uuid=ANY(campaign.product_ids)
        OR campaign.scope='categories' AND (line->>'category_id')::uuid=ANY(campaign.category_ids) THEN
        eligible_running := eligible_running+(line->>'unit_price_fils')::bigint*(line->>'quantity')::integer;
        line_discount := floor(discount::numeric*eligible_running/(offer_quote->>'eligible_fils')::bigint)::integer-allocated;
        allocated := allocated+line_discount;
        UPDATE public.order_items SET discount_fils=line_discount WHERE order_id=new_id AND variant_id=(line->>'variant_id')::uuid;
      END IF;
    END LOOP;
    INSERT INTO public.offer_redemptions(offer_id,order_id,customer_email,state)
      VALUES(campaign.id,new_id,customer_email,CASE WHEN method='card' THEN 'reserved' ELSE 'redeemed' END);
  END IF;
  INSERT INTO public.customers(email,full_name,phone,clerk_user_id,updated_at)
    VALUES(customer_email,p_customer->>'fullName',p_customer->>'phone',p_user_id,now())
    ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name,phone=EXCLUDED.phone,
      clerk_user_id=COALESCE(EXCLUDED.clerk_user_id,public.customers.clerk_user_id),updated_at=now();
  IF coupon.id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions(coupon_id,order_id,customer_email,clerk_user_id,discount_fils)
      VALUES(coupon.id,new_id,customer_email,p_user_id,discount);
    UPDATE public.coupons SET usage_count=usage_count+1,updated_at=now() WHERE id=coupon.id;
  END IF;
  INSERT INTO public.order_events(order_id,event_type,to_status,note,actor_sub)
    VALUES(new_id,CASE WHEN method='cod' THEN 'cod_order_placed' ELSE 'card_order_placed' END,'pending','Order placed; stock reserved.',COALESCE(p_user_id,'storefront_shopper'));
  RETURN jsonb_build_object('order_id',new_id,'order_number',new_number,'created',true);
END;
$$;

REVOKE ALL ON FUNCTION public.place_store_order(uuid,jsonb,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.place_store_order(uuid,jsonb,jsonb,text,text,text) TO service_role;



-- Preserve the established COD entry point and share its transaction with campaign checkout.
CREATE OR REPLACE FUNCTION public.place_cod_order(p_key uuid,p_customer jsonb,p_items jsonb,p_user_id text,p_coupon_code text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT public.place_store_order(p_key,p_customer || '{"paymentMethod":"cod"}'::jsonb,p_items,p_user_id,p_coupon_code,NULL);
$$;
REVOKE ALL ON FUNCTION public.place_cod_order(uuid,jsonb,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.place_cod_order(uuid,jsonb,jsonb,text,text) TO service_role;

CREATE FUNCTION public.save_offer(p_id uuid,p_data jsonb,p_actor text) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE result_id uuid; before_row jsonb; existing public.offers%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id::text=p_actor AND role='admin' AND is_active) THEN RAISE EXCEPTION 'Admin access required.'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_data->'product_ids') x WHERE NOT EXISTS(SELECT 1 FROM public.products p WHERE p.id=x::uuid))
    OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_data->'category_ids') x WHERE NOT EXISTS(SELECT 1 FROM public.categories c WHERE c.id=x::uuid)) THEN
    RAISE EXCEPTION 'An offer target does not exist.';
  END IF;
  IF p_id IS NOT NULL THEN
    SELECT * INTO STRICT existing FROM public.offers WHERE id=p_id FOR UPDATE;
    before_row := to_jsonb(existing);
    IF existing.slug<>p_data->>'slug' THEN RAISE EXCEPTION 'The offer link cannot be changed after creation.'; END IF;
  END IF;
  INSERT INTO public.offers(id,slug,title,description,terms,status,discount_type,discount_value,scope,product_ids,category_ids,
    min_order_fils,max_discount_fils,usage_limit,per_customer_limit,starts_at,expires_at)
  VALUES(COALESCE(p_id,gen_random_uuid()),p_data->>'slug',p_data->>'title',p_data->>'description',p_data->>'terms',p_data->>'status',
    p_data->>'discount_type',(p_data->>'discount_value')::integer,p_data->>'scope',
    ARRAY(SELECT jsonb_array_elements_text(p_data->'product_ids')::uuid),ARRAY(SELECT jsonb_array_elements_text(p_data->'category_ids')::uuid),
    (p_data->>'min_order_fils')::integer,(p_data->>'max_discount_fils')::integer,(p_data->>'usage_limit')::integer,
    (p_data->>'per_customer_limit')::integer,(p_data->>'starts_at')::timestamptz,(p_data->>'expires_at')::timestamptz)
  ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,terms=EXCLUDED.terms,status=EXCLUDED.status,
    discount_type=EXCLUDED.discount_type,discount_value=EXCLUDED.discount_value,scope=EXCLUDED.scope,product_ids=EXCLUDED.product_ids,
    category_ids=EXCLUDED.category_ids,min_order_fils=EXCLUDED.min_order_fils,max_discount_fils=EXCLUDED.max_discount_fils,
    usage_limit=EXCLUDED.usage_limit,per_customer_limit=EXCLUDED.per_customer_limit,starts_at=EXCLUDED.starts_at,
    expires_at=EXCLUDED.expires_at,updated_at=now() RETURNING id INTO result_id;
  INSERT INTO public.audit_log(actor_sub,action,entity_type,entity_id,before_data,after_data)
    VALUES(p_actor,CASE WHEN p_id IS NULL THEN 'offer_created' ELSE 'offer_updated' END,'offer',result_id,before_row,p_data);
  RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION public.save_offer(uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_offer(uuid,jsonb,text) TO service_role;

-- Serialize partial returns of the same offer line; browser amounts never increase the refundable value.
CREATE FUNCTION public.guard_offer_return() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE item public.order_items%ROWTYPE; returned integer; max_refund integer;
BEGIN
  SELECT oi.* INTO item FROM public.order_items oi JOIN public.orders o ON o.id=oi.order_id
    WHERE oi.id=NEW.order_item_id AND o.offer_id IS NOT NULL FOR UPDATE OF oi;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.return_requests rr WHERE rr.id=NEW.return_id AND rr.order_id=item.order_id) THEN RAISE EXCEPTION 'Return does not match the purchased order.'; END IF;
  SELECT COALESCE(sum(ri.quantity),0) INTO returned FROM public.return_items ri
    JOIN public.return_requests rr ON rr.id=ri.return_id
    WHERE ri.order_item_id=item.id AND ri.id<>NEW.id AND rr.status NOT IN ('rejected','cancelled');
  IF NEW.quantity<1 OR returned+NEW.quantity>item.quantity THEN RAISE EXCEPTION 'Return quantity exceeds the remaining purchased quantity.'; END IF;
  max_refund := floor((item.total_fils-item.discount_fils)::numeric*(returned+NEW.quantity)/item.quantity)
    -floor((item.total_fils-item.discount_fils)::numeric*returned/item.quantity);
  IF NEW.refund_amount_fils<0 OR NEW.refund_amount_fils>max_refund THEN RAISE EXCEPTION 'Refund exceeds the discounted amount paid for these items.'; END IF;
  NEW.unit_price_fils := item.unit_price_fils;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_offer_return BEFORE INSERT OR UPDATE OF quantity,refund_amount_fils ON public.return_items
  FOR EACH ROW EXECUTE FUNCTION public.guard_offer_return();
REVOKE ALL ON FUNCTION public.guard_offer_return() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_offer_return() TO service_role;

CREATE FUNCTION public.get_offer_usage(p_ids uuid[]) RETURNS TABLE(offer_id uuid,reserved bigint,redeemed bigint)
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT r.offer_id,count(*) FILTER(WHERE r.state='reserved'),count(*) FILTER(WHERE r.state='redeemed')
  FROM public.offer_redemptions r WHERE r.offer_id=ANY(p_ids) GROUP BY r.offer_id;
$$;
REVOKE ALL ON FUNCTION public.get_offer_usage(uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_offer_usage(uuid[]) TO service_role;

-- Different Stripe event IDs for the same paid order must not consume its stock twice.
CREATE FUNCTION public.fulfill_offer_order(p_order_id uuid,p_stripe_session_id text,p_stripe_payment_intent_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE ord public.orders%ROWTYPE; fulfilled boolean;
BEGIN
  SELECT * INTO STRICT ord FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF ord.offer_id IS NULL OR ord.payment_method<>'card' THEN RAISE EXCEPTION 'Not a card offer order.'; END IF;
  IF ord.payment_status IN ('paid','refunded') OR ord.stock_consumed_at IS NOT NULL THEN RETURN false; END IF;
  IF ord.status<>'pending' OR ord.stock_released_at IS NOT NULL THEN RAISE EXCEPTION 'This order needs payment reconciliation.'; END IF;
  IF ord.stripe_session_id IS NOT NULL AND ord.stripe_session_id<>p_stripe_session_id THEN RAISE EXCEPTION 'Checkout session does not match this order.'; END IF;
  fulfilled := public.fulfill_card_order(p_order_id,p_stripe_session_id,p_stripe_payment_intent_id);
  IF fulfilled THEN UPDATE public.orders SET stock_consumed_at=now(),offer_payment_note=NULL WHERE id=ord.id; END IF;
  RETURN fulfilled;
END $$;
REVOKE ALL ON FUNCTION public.fulfill_offer_order(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_offer_order(uuid,text,text) TO service_role;
