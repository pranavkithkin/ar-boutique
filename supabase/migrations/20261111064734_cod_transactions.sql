-- Service-only COD transactions. Applied version: 20261111064734.
-- Admin/customer identity is verified by server actions.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_key uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_request_hash text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_consumed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_released_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_key_unique ON public.orders(checkout_key) WHERE checkout_key IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq;
SELECT setval('public.order_number_seq', GREATEST(1044,
  COALESCE((SELECT max(substring(order_number from '^AR-([0-9]+)$')::bigint) FROM public.orders),1044)),true);

CREATE OR REPLACE FUNCTION public.next_order_number() RETURNS text
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT 'AR-' || nextval('public.order_number_seq')::text;
$$;
REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.next_order_number() FROM anon,authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO service_role;

CREATE OR REPLACE FUNCTION public.place_cod_order(
  p_key uuid, p_customer jsonb, p_items jsonb, p_user_id text, p_coupon_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
<<cod_checkout>>
DECLARE
  prior public.orders%ROWTYPE;
  config public.settings%ROWTYPE;
  coupon public.coupons%ROWTYPE;
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
  request_hash := md5(jsonb_build_object('customer',p_customer,'items',p_items,'user',p_user_id,'coupon',p_coupon_code)::text);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
  SELECT * INTO prior FROM public.orders WHERE checkout_key=p_key;
  IF FOUND THEN
    IF prior.checkout_request_hash IS DISTINCT FROM request_hash THEN
      RAISE EXCEPTION 'Checkout details changed. Please start a new checkout.';
    END IF;
    RETURN jsonb_build_object('order_id',prior.id,'order_number',prior.order_number,'created',false);
  END IF;

  SELECT * INTO config FROM public.settings WHERE id=true FOR SHARE;
  IF NOT FOUND OR NOT config.cod_enabled THEN RAISE EXCEPTION 'Cash on delivery is unavailable.'; END IF;
  IF config.cod_signed_in_only AND p_user_id IS NULL THEN RAISE EXCEPTION 'Please sign in to use cash on delivery.'; END IF;
  -- Serialize eligibility checks across concurrent attempts for the same customer.
  PERFORM pg_advisory_xact_lock(hashtextextended('cod-email:'||customer_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended('cod-phone:'||customer_phone,0));
  IF p_user_id IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('cod-user:'||p_user_id,0)); END IF;
  IF EXISTS(SELECT 1 FROM public.customers c WHERE c.cod_disabled AND
    (lower(c.email)=customer_email OR c.clerk_user_id=p_user_id OR regexp_replace(c.phone,'[^0-9]','','g')=customer_phone)) THEN
    RAISE EXCEPTION 'Cash on delivery is restricted for this customer.';
  END IF;
  IF (SELECT count(*) FROM public.orders o WHERE o.payment_method='cod'
      AND o.status IN ('pending','awaiting_confirmation','confirmed','packed','shipped')
      AND (lower(o.email)=customer_email OR o.clerk_user_id=p_user_id OR regexp_replace(o.phone,'[^0-9]','','g')=customer_phone)) >= COALESCE(config.cod_max_open_orders,1) THEN
    RAISE EXCEPTION 'Please complete or cancel your existing cash on delivery order first.';
  END IF;
  IF (SELECT count(*) FROM public.orders o WHERE o.payment_method='cod' AND o.status='returned_to_sender'
      AND (lower(o.email)=customer_email OR o.clerk_user_id=p_user_id OR regexp_replace(o.phone,'[^0-9]','','g')=customer_phone)) >= COALESCE(config.cod_refusal_limit,2) THEN
    RAISE EXCEPTION 'Cash on delivery is restricted due to delivery refusals.';
  END IF;

  FOR line IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF (line->>'quantity') IS NULL OR (line->>'quantity') !~ '^[1-5]$' THEN RAISE EXCEPTION 'Invalid item quantity.'; END IF;
    quantity := (line->>'quantity')::integer;
    SELECT v.id,v.product_id,v.product_colour_id,v.sku,v.price_fils,p.name,p.is_final_sale,
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
      'product_colour_id',item.product_colour_id,'sku',item.sku,'unit_price_fils',item.price_fils,
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
  total := GREATEST(0,subtotal-discount)+delivery+config.cod_fee_fils;
  IF total>config.cod_max_order_fils THEN RAISE EXCEPTION 'Order exceeds the cash on delivery limit.'; END IF;

  FOR line IN SELECT value FROM jsonb_array_elements(lines) ORDER BY value->>'variant_id' LOOP
    UPDATE public.stock_levels SET reserved=reserved+(line->>'quantity')::integer,updated_at=now()
      WHERE variant_id=(line->>'variant_id')::uuid AND on_hand-reserved >= (line->>'quantity')::integer;
    IF NOT FOUND THEN RAISE EXCEPTION 'An item is no longer available in the requested quantity.'; END IF;
  END LOOP;
  new_number := public.next_order_number();
  INSERT INTO public.orders(id,order_number,checkout_key,checkout_request_hash,clerk_user_id,email,customer_name,phone,
    emirate,area,street_address,building,apartment,landmark,internal_notes,status,payment_method,payment_status,
    subtotal_fils,discount_fils,delivery_fee_fils,cod_fee_fils,vat_fils,total_fils,vat_rate_bps,confirm_by)
  VALUES(new_id,new_number,p_key,request_hash,p_user_id,customer_email,p_customer->>'fullName',p_customer->>'phone',
    p_customer->>'emirate',p_customer->>'area',p_customer->>'street',p_customer->>'building',p_customer->>'apartment',
    p_customer->>'landmark',NULLIF(p_customer->>'instructions',''),'pending','cod','pending',subtotal,discount,delivery,
    config.cod_fee_fils,CASE WHEN config.vat_enabled THEN round(total::numeric*config.vat_rate_bps/(10000+config.vat_rate_bps)) ELSE 0 END,
    total,CASE WHEN config.vat_enabled THEN config.vat_rate_bps ELSE 0 END,now()+make_interval(hours=>COALESCE(config.cod_confirm_hours,24)));
  INSERT INTO public.order_items(order_id,variant_id,product_id,product_colour_id,sku,product_name,colour_name,
    style_code,size_label,unit_price_fils,quantity,total_fils,is_final_sale,media_key)
    SELECT new_id,(x->>'variant_id')::uuid,(x->>'product_id')::uuid,(x->>'product_colour_id')::uuid,x->>'sku',x->>'product_name',
      x->>'colour_name',x->>'style_code',x->>'size_label',(x->>'unit_price_fils')::integer,(x->>'quantity')::integer,
      (x->>'unit_price_fils')::integer*(x->>'quantity')::integer,(x->>'is_final_sale')::boolean,x->>'media_key' FROM jsonb_array_elements(lines) x;
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
    VALUES(new_id,'cod_order_placed','pending','Cash on delivery order placed; stock reserved.',COALESCE(p_user_id,'storefront_shopper'));
  RETURN jsonb_build_object('order_id',new_id,'order_number',new_number,'created',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_cod_order(
  p_order_id uuid,p_status text,p_admin_id uuid,p_courier text DEFAULT NULL,p_tracking_number text DEFAULT NULL,p_note text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_order public.orders%ROWTYPE; item record;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=p_admin_id AND is_active AND role='admin') THEN
    RAISE EXCEPTION 'Active admin required.';
  END IF;
  SELECT * INTO current_order FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR current_order.payment_method<>'cod' THEN RAISE EXCEPTION 'COD order not found.'; END IF;
  IF current_order.status=p_status THEN RETURN false; END IF;
  IF NOT ((current_order.status IN ('pending','awaiting_confirmation') AND p_status IN ('confirmed','cancelled'))
    OR (current_order.status='confirmed' AND p_status IN ('packed','cancelled'))
    OR (current_order.status='packed' AND p_status IN ('shipped','cancelled'))
    OR (current_order.status='shipped' AND p_status IN ('delivered','returned_to_sender')))
    THEN RAISE EXCEPTION 'Invalid order status transition.'; END IF;
  IF p_status IN ('shipped','cancelled') THEN
    IF current_order.stock_consumed_at IS NOT NULL OR current_order.stock_released_at IS NOT NULL THEN
      RAISE EXCEPTION 'Order stock has already been processed.';
    END IF;
    FOR item IN SELECT variant_id,sum(quantity)::integer AS quantity FROM public.order_items
      WHERE order_id=p_order_id GROUP BY variant_id ORDER BY variant_id LOOP
      IF item.variant_id IS NULL THEN RAISE EXCEPTION 'Order has an unresolved stock item.'; END IF;
      UPDATE public.stock_levels SET
        on_hand=on_hand-CASE WHEN p_status='shipped' THEN item.quantity ELSE 0 END,
        reserved=reserved-item.quantity,updated_at=now()
        WHERE variant_id=item.variant_id AND reserved>=item.quantity
          AND (p_status<>'shipped' OR on_hand>=item.quantity);
      IF NOT FOUND THEN RAISE EXCEPTION 'Reserved inventory is inconsistent. Please review stock.'; END IF;
    END LOOP;
  END IF;
  UPDATE public.orders SET status=p_status,updated_at=now(),
    confirmed_at=CASE WHEN p_status='confirmed' THEN now() ELSE confirmed_at END,
    packed_at=CASE WHEN p_status='packed' THEN now() ELSE packed_at END,
    shipped_at=CASE WHEN p_status='shipped' THEN now() ELSE shipped_at END,
    delivered_at=CASE WHEN p_status='delivered' THEN now() ELSE delivered_at END,
    cancelled_at=CASE WHEN p_status='cancelled' THEN now() ELSE cancelled_at END,
    cancellation_reason=CASE WHEN p_status='cancelled' THEN p_note ELSE cancellation_reason END,
    stock_consumed_at=CASE WHEN p_status='shipped' THEN now() ELSE stock_consumed_at END,
    stock_released_at=CASE WHEN p_status='cancelled' THEN now() ELSE stock_released_at END,
    courier=CASE WHEN p_status='shipped' THEN NULLIF(trim(p_courier),'') ELSE courier END,
    tracking_number=CASE WHEN p_status='shipped' THEN NULLIF(trim(p_tracking_number),'') ELSE tracking_number END,
    payment_status=CASE WHEN p_status='delivered' THEN 'paid' ELSE payment_status END
    WHERE id=p_order_id;
  INSERT INTO public.order_events(order_id,event_type,from_status,to_status,note,actor_sub)
    VALUES(p_order_id,'status_changed_to_'||p_status,current_order.status,p_status,p_note,p_admin_id::text);
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.cancel_customer_cod_order(p_order_id uuid,p_email text,p_note text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_order public.orders%ROWTYPE; item record;
BEGIN
  SELECT * INTO current_order FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR current_order.payment_method<>'cod' OR lower(current_order.email) IS DISTINCT FROM lower(p_email) THEN
    RAISE EXCEPTION 'Order not found or access denied.';
  END IF;
  IF current_order.status='cancelled' THEN RETURN false; END IF;
  IF current_order.status NOT IN ('pending','awaiting_confirmation','confirmed','packed')
    OR current_order.stock_consumed_at IS NOT NULL OR current_order.stock_released_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order can no longer be cancelled.';
  END IF;
  FOR item IN SELECT variant_id,sum(quantity)::integer AS quantity FROM public.order_items
    WHERE order_id=p_order_id GROUP BY variant_id ORDER BY variant_id LOOP
    IF item.variant_id IS NULL THEN RAISE EXCEPTION 'Order has an unresolved stock item.'; END IF;
    UPDATE public.stock_levels SET reserved=reserved-item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND reserved>=item.quantity;
    IF NOT FOUND THEN RAISE EXCEPTION 'Reserved inventory is inconsistent. Please review stock.'; END IF;
  END LOOP;
  UPDATE public.orders SET status='cancelled',cancelled_at=now(),stock_released_at=now(),
    cancellation_reason=p_note,updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_events(order_id,event_type,from_status,to_status,note,actor_sub)
    VALUES(p_order_id,'customer_order_cancelled',current_order.status,'cancelled',p_note,p_email);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.place_cod_order(uuid,jsonb,jsonb,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.transition_cod_order(uuid,text,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.cancel_customer_cod_order(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.place_cod_order(uuid,jsonb,jsonb,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.transition_cod_order(uuid,text,uuid,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_customer_cod_order(uuid,text,text) TO service_role;
