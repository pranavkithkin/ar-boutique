-- Run within a transaction and roll back: no test orders, coupon or stock changes persist.
DO $$
<<cod_transactions>>
DECLARE
  v1 uuid; v2 uuid; admin_id uuid; key1 uuid := gen_random_uuid(); key2 uuid := gen_random_uuid();
  customer jsonb; items jsonb; first_result jsonb; retry_result jsonb; cancel_result jsonb;
  order_id uuid; cancel_id uuid; coupon_id uuid; coupon_code text := 'COD-TEST-'||gen_random_uuid()::text;
  before_orders bigint; before_redemptions bigint; before_usage integer; stock_before integer;
BEGIN
  SELECT v.id INTO v1 FROM public.product_variants v JOIN public.products p ON p.id=v.product_id
    JOIN public.product_colours pc ON pc.id=v.product_colour_id
    WHERE v.is_active AND pc.is_active AND p.status='published' AND v.price_fils IS NOT NULL
    ORDER BY v.id LIMIT 1;
  SELECT v.id INTO v2 FROM public.product_variants v JOIN public.products p ON p.id=v.product_id
    JOIN public.product_colours pc ON pc.id=v.product_colour_id
    WHERE v.is_active AND pc.is_active AND p.status='published' AND v.price_fils IS NOT NULL AND v.id<>v1
    ORDER BY v.id LIMIT 1;
  SELECT user_id INTO admin_id FROM public.admin_users WHERE is_active AND role='admin' LIMIT 1;
  ASSERT v1 IS NOT NULL AND v2 IS NOT NULL AND admin_id IS NOT NULL,'Existing catalogue/admin needed for rollback tests';
  UPDATE public.settings SET cod_enabled=true,cod_signed_in_only=false,cod_max_order_fils=2147483647,
    cod_max_open_orders=100000,cod_refusal_limit=100000 WHERE id=true;
  UPDATE public.stock_levels SET on_hand=10,reserved=0 WHERE variant_id IN(v1,v2);
  INSERT INTO public.coupons(code,discount_type,discount_value,per_customer_limit,usage_limit)
    VALUES(coupon_code,'fixed_fils',1,100,100) RETURNING id INTO coupon_id;
  customer := jsonb_build_object('fullName','Rollback Test','email',gen_random_uuid()::text||'@example.com',
    'phone','+971'||substr(replace(gen_random_uuid()::text,'-',''),1,10),'emirate','Dubai','area','Test','street','Test','building','Test');
  items := jsonb_build_array(jsonb_build_object('variant_id',v1,'quantity',1));
  first_result := public.place_cod_order(key1,customer,items,NULL,coupon_code);
  order_id := (first_result->>'order_id')::uuid;
  ASSERT (first_result->>'created')::boolean,'First attempt creates order';
  ASSERT (SELECT reserved=1 AND on_hand=10 FROM public.stock_levels WHERE variant_id=v1),'Creation reserves without deducting on hand';
  ASSERT (SELECT count(*)=1 FROM public.order_items WHERE order_items.order_id=cod_transactions.order_id),'Exactly one item snapshot';
  ASSERT (SELECT oi.unit_price_fils=v.price_fils FROM public.order_items oi JOIN public.product_variants v ON v.id=oi.variant_id WHERE oi.order_id=cod_transactions.order_id),'Database reprices the item';
  retry_result := public.place_cod_order(key1,customer,items,NULL,coupon_code);
  ASSERT retry_result->>'order_id'=first_result->>'order_id' AND NOT (retry_result->>'created')::boolean,'Retry reuses order';
  ASSERT (SELECT reserved=1 FROM public.stock_levels WHERE variant_id=v1),'Retry does not reserve twice';
  ASSERT (SELECT usage_count=1 FROM public.coupons WHERE id=coupon_id),'Retry does not redeem coupon twice';
  BEGIN
    PERFORM public.place_cod_order(key1,customer,jsonb_build_array(jsonb_build_object('variant_id',v1,'quantity',2)),NULL,coupon_code);
    RAISE EXCEPTION 'Changed request was accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  SELECT count(*) INTO before_orders FROM public.orders;
  SELECT count(*) INTO before_redemptions FROM public.coupon_redemptions;
  SELECT usage_count INTO before_usage FROM public.coupons WHERE id=coupon_id;
  -- A late order insert error occurs after stock reservation; the whole function must roll back.
  BEGIN
    PERFORM public.place_cod_order(gen_random_uuid(),customer-'fullName',items,NULL,coupon_code);
    RAISE EXCEPTION 'Invalid order unexpectedly created' USING ERRCODE='XX000';
  EXCEPTION WHEN not_null_violation THEN NULL; END;
  ASSERT (SELECT count(*)=before_orders FROM public.orders),'Failed order leaves no order';
  ASSERT (SELECT count(*)=before_redemptions FROM public.coupon_redemptions),'Failed order leaves no redemption';
  ASSERT (SELECT usage_count=before_usage FROM public.coupons WHERE id=coupon_id),'Failed order leaves coupon unchanged';
  ASSERT (SELECT reserved=1 FROM public.stock_levels WHERE variant_id=v1),'Late failure rolls back reservations';
  UPDATE public.stock_levels SET reserved=on_hand WHERE variant_id=v2;
  BEGIN
    PERFORM public.place_cod_order(gen_random_uuid(),customer,items||jsonb_build_array(jsonb_build_object('variant_id',v2,'quantity',1)),NULL,coupon_code);
    RAISE EXCEPTION 'Sold out checkout unexpectedly created' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  ASSERT (SELECT count(*)=before_orders FROM public.orders),'Stock failure leaves no order';
  ASSERT (SELECT reserved=1 FROM public.stock_levels WHERE variant_id=v1),'Multi-item failure rolls back earlier reservations';
  PERFORM public.transition_cod_order(order_id,'confirmed',admin_id);
  PERFORM public.transition_cod_order(order_id,'packed',admin_id);
  PERFORM public.transition_cod_order(order_id,'shipped',admin_id);
  ASSERT (SELECT reserved=0 AND on_hand=9 FROM public.stock_levels WHERE variant_id=v1),'Shipping consumes held stock';
  ASSERT NOT public.transition_cod_order(order_id,'shipped',admin_id),'Repeated shipping is a no-op';
  ASSERT (SELECT on_hand=9 FROM public.stock_levels WHERE variant_id=v1),'Repeated shipping does not deduct twice';
  BEGIN
    PERFORM public.transition_cod_order(order_id,'cancelled',admin_id);
    RAISE EXCEPTION 'Shipped order was cancelled' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  cancel_result := public.place_cod_order(key2,customer,items,NULL,NULL);
  cancel_id := (cancel_result->>'order_id')::uuid;
  PERFORM public.transition_cod_order(cancel_id,'cancelled',admin_id);
  ASSERT (SELECT on_hand=9 AND reserved=0 FROM public.stock_levels WHERE variant_id=v1),'Cancellation releases only holds, never restocks';
  ASSERT NOT public.transition_cod_order(cancel_id,'cancelled',admin_id),'Repeated cancellation is a no-op';
  ASSERT (SELECT reserved=0 FROM public.stock_levels WHERE variant_id=v1),'Repeated cancellation does not release twice';
  cancel_result := public.place_cod_order(gen_random_uuid(),customer,items,NULL,NULL);
  cancel_id := (cancel_result->>'order_id')::uuid;
  BEGIN
    PERFORM public.cancel_customer_cod_order(cancel_id,'someone-else@example.com','Test');
    RAISE EXCEPTION 'Wrong customer allowed to cancel' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  PERFORM public.cancel_customer_cod_order(cancel_id,customer->>'email','Test');
  ASSERT (SELECT on_hand=9 AND reserved=0 FROM public.stock_levels WHERE variant_id=v1),'Customer cancellation releases reservation';
  ASSERT NOT public.transition_cod_order(cancel_id,'cancelled',admin_id),'Admin cancellation after customer cancellation is a no-op';
  ASSERT NOT has_function_privilege('anon','public.place_cod_order(uuid,jsonb,jsonb,text,text)','EXECUTE'),'Anonymous direct access denied';
  ASSERT NOT has_function_privilege('authenticated','public.transition_cod_order(uuid,text,uuid,text,text,text)','EXECUTE'),'Customer direct status access denied';
  UPDATE public.settings SET cod_enabled=false WHERE id=true;
  BEGIN
    PERFORM public.place_cod_order(gen_random_uuid(),customer,items,NULL,NULL);
    RAISE EXCEPTION 'Disabled COD accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.settings SET cod_enabled=true,cod_signed_in_only=true WHERE id=true;
  BEGIN
    PERFORM public.place_cod_order(gen_random_uuid(),customer,items,NULL,NULL);
    RAISE EXCEPTION 'Unsigned COD accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.settings SET cod_signed_in_only=false,cod_max_open_orders=1 WHERE id=true;
  -- The first order is shipped and still open; a new attempt must be rejected.
  BEGIN
    PERFORM public.place_cod_order(gen_random_uuid(),customer,items,NULL,NULL);
    RAISE EXCEPTION 'Open COD order limit ignored' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
END;
$$;
SELECT 'COD transaction assertions passed' AS result;
