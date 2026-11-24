-- Run after the migration against a local/test database. All test changes roll back.
BEGIN;
DO $$
DECLARE
  campaign uuid; another uuid; result jsonb; again jsonb; q jsonb; ord uuid; before_count integer;
  key uuid := gen_random_uuid();
  customer jsonb := '{"email":"offer-test@example.test","fullName":"Offer test","phone":"+971501234567","emirate":"Dubai","area":"Test","street":"Test","building":"Test","paymentMethod":"card"}';
  items jsonb := '[{"variant_id":"01581467-7bb3-4717-96d4-298132d8a06d","quantity":2},{"variant_id":"0213a7a0-c8c6-4b83-8ca3-9f0469363e10","quantity":1}]';
BEGIN
  IF has_function_privilege('anon','public.place_store_order(uuid,jsonb,jsonb,text,text,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.save_offer(uuid,jsonb,text)','EXECUTE') THEN RAISE EXCEPTION 'RPC exposed'; END IF;
  IF has_table_privilege('anon','public.offer_redemptions','SELECT') OR has_table_privilege('authenticated','public.offers','UPDATE') THEN RAISE EXCEPTION 'Private offer data exposed'; END IF;
  INSERT INTO public.offers(slug,title,status,discount_type,discount_value,scope,product_ids,per_customer_limit,usage_limit)
    VALUES('offer-test','Offer test','published','percentage',20,'products',ARRAY['be7da261-1489-4137-92e9-8bd95750eeb2'::uuid],1,2) RETURNING id INTO campaign;
  q := public.quote_offer('offer-test',items,NULL);
  IF (q->>'subtotal_fils')::integer<>24700 OR (q->>'eligible_fils')::integer<>16000 OR (q->>'discount_fils')::integer<>3200 THEN RAISE EXCEPTION 'Mixed bag repricing failed: %',q; END IF;
  result := public.place_store_order(key,customer,items,NULL,NULL,'offer-test');
  ord := (result->>'order_id')::uuid;
  IF (SELECT total_fils FROM public.orders WHERE id=ord)<>21500 THEN RAISE EXCEPTION 'Incorrect order total'; END IF;
  IF (SELECT sum(discount_fils) FROM public.order_items WHERE order_id=ord)<>3200 THEN RAISE EXCEPTION 'Allocation mismatch'; END IF;
  IF EXISTS(SELECT 1 FROM public.order_items WHERE order_id=ord AND sku='AR4380-TP-M' AND discount_fils<>0) THEN RAISE EXCEPTION 'Non-eligible item discounted'; END IF;
  again := public.place_store_order(key,customer,items,NULL,NULL,'offer-test');
  IF again->>'order_id'<>result->>'order_id' OR (again->>'created')::boolean THEN RAISE EXCEPTION 'Retry duplicated order'; END IF;
  BEGIN PERFORM public.place_store_order(key,customer,items,NULL,NULL,'other-offer'); RAISE EXCEPTION 'expected mismatch' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  BEGIN PERFORM public.place_store_order(gen_random_uuid(),customer,items,NULL,'PROMO','offer-test'); RAISE EXCEPTION 'expected no stacking' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  BEGIN PERFORM public.quote_offer('offer-test',items,'offer-test@example.test'); RAISE EXCEPTION 'expected customer limit' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  PERFORM public.cancel_offer_checkout(ord); PERFORM public.cancel_offer_checkout(ord);
  IF (SELECT reserved FROM public.stock_levels WHERE variant_id='01581467-7bb3-4717-96d4-298132d8a06d')<>0 THEN RAISE EXCEPTION 'Cancellation leaked stock'; END IF;
  IF (SELECT state FROM public.offer_redemptions WHERE order_id=ord)<>'released' THEN RAISE EXCEPTION 'Cancellation leaked usage'; END IF;
  -- Fixed discounts are capped at eligible value; caps and scheduling enforced on the server.
  UPDATE public.offers SET discount_type='fixed_fils',discount_value=20000,max_discount_fils=3333 WHERE id=campaign;
  q := public.quote_offer('offer-test',items,NULL);
  IF (q->>'discount_fils')::integer<>3333 THEN RAISE EXCEPTION 'Cap failed'; END IF;
  UPDATE public.offers SET scope='categories',category_ids=ARRAY['1377e04f-2293-429b-b5f6-484028d9bb8c'::uuid],max_discount_fils=NULL WHERE id=campaign;
  q := public.quote_offer('offer-test',items,NULL);
  IF (q->>'eligible_fils')::integer<>24700 THEN RAISE EXCEPTION 'Category targeting failed'; END IF;
  UPDATE public.offers SET min_order_fils=30000 WHERE id=campaign;
  BEGIN PERFORM public.quote_offer('offer-test',items,NULL); RAISE EXCEPTION 'expected min spend' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.offers SET min_order_fils=0,starts_at=now()+interval '1 hour' WHERE id=campaign;
  BEGIN PERFORM public.quote_offer('offer-test',items,NULL); RAISE EXCEPTION 'expected scheduled' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.offers SET starts_at=NULL,expires_at=now()-interval '1 second' WHERE id=campaign;
  BEGIN PERFORM public.quote_offer('offer-test',items,NULL); RAISE EXCEPTION 'expected expired' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.offers SET expires_at=NULL,status='disabled' WHERE id=campaign;
  BEGIN PERFORM public.quote_offer('offer-test',items,NULL); RAISE EXCEPTION 'expected disabled' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.offers SET status='published',discount_type='free_shipping' WHERE id=campaign;
  customer := customer || '{"paymentMethod":"cod"}';
  result := public.place_store_order(gen_random_uuid(),customer,items,'test-user',NULL,'offer-test');
  ord := (result->>'order_id')::uuid;
  IF (SELECT delivery_fee_fils FROM public.orders WHERE id=ord)<>0 OR (SELECT cod_fee_fils FROM public.orders WHERE id=ord)<>500 OR (SELECT discount_fils FROM public.orders WHERE id=ord)<>0 THEN RAISE EXCEPTION 'Free delivery changed merchandise or COD fees'; END IF;
  IF (SELECT state FROM public.offer_redemptions WHERE order_id=ord)<>'redeemed' THEN RAISE EXCEPTION 'COD redemption missing'; END IF;
  UPDATE public.orders SET status='cancelled' WHERE id=ord;
  IF (SELECT state FROM public.offer_redemptions WHERE order_id=ord)<>'released' THEN RAISE EXCEPTION 'COD cancel did not release usage'; END IF;
  -- A late stock failure must roll back the header, items and usage together.
  UPDATE public.stock_levels SET reserved=0,on_hand=0 WHERE variant_id='0213a7a0-c8c6-4b83-8ca3-9f0469363e10';
  SELECT count(*) INTO before_count FROM public.orders;
  BEGIN PERFORM public.place_store_order(gen_random_uuid(),customer,items,'test-user',NULL,'offer-test'); RAISE EXCEPTION 'expected stock failure' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  IF (SELECT count(*) FROM public.orders)<>before_count THEN RAISE EXCEPTION 'Failed checkout left an order'; END IF;
  IF (SELECT reserved FROM public.stock_levels WHERE variant_id='01581467-7bb3-4717-96d4-298132d8a06d')<>2 THEN RAISE EXCEPTION 'Failed checkout leaked a reservation'; END IF;
  UPDATE public.stock_levels SET on_hand=100,reserved=0;
  UPDATE public.offers SET discount_type='fixed_fils',discount_value=3333,usage_limit=1,per_customer_limit=NULL WHERE id=campaign;
  customer := customer || '{"paymentMethod":"card"}';
  result := public.place_store_order(gen_random_uuid(),customer,items,NULL,NULL,'offer-test');
  ord := (result->>'order_id')::uuid;
  IF (SELECT sum(discount_fils) FROM public.order_items WHERE order_id=ord)<>3333 THEN RAISE EXCEPTION 'Proportional rounding lost fils'; END IF;
  BEGIN PERFORM public.place_store_order(gen_random_uuid(),customer||'{"email":"second@example.test"}',items,NULL,NULL,'offer-test'); RAISE EXCEPTION 'expected global limit' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  UPDATE public.orders SET stripe_session_id='cs_test_offer' WHERE id=ord;
  BEGIN PERFORM public.fulfill_offer_order(ord,'cs_wrong_session',NULL); RAISE EXCEPTION 'expected session mismatch' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  IF NOT public.fulfill_offer_order(ord,'cs_test_offer',NULL) THEN RAISE EXCEPTION 'Payment was not fulfilled'; END IF;
  UPDATE public.orders SET status='shipped' WHERE id=ord;
  IF public.fulfill_offer_order(ord,'cs_test_offer',NULL) THEN RAISE EXCEPTION 'Second payment event consumed stock again'; END IF;
  IF (SELECT on_hand FROM public.stock_levels WHERE variant_id='01581467-7bb3-4717-96d4-298132d8a06d')<>98 THEN RAISE EXCEPTION 'Fulfillment consumed stock twice'; END IF;
  IF (SELECT state FROM public.offer_redemptions WHERE order_id=ord)<>'redeemed' THEN RAISE EXCEPTION 'Paid usage not committed'; END IF;
  UPDATE public.offers SET discount_value=9000 WHERE id=campaign;
  IF (SELECT (offer_snapshot->>'discount_value')::integer FROM public.orders WHERE id=ord)<>3333 THEN RAISE EXCEPTION 'Order snapshot changed'; END IF;
  INSERT INTO public.return_requests(id,order_id,status) VALUES(gen_random_uuid(),ord,'requested') RETURNING id INTO another;
  BEGIN
    INSERT INTO public.return_items(return_id,order_item_id,quantity,unit_price_fils,refund_amount_fils)
      SELECT another,id,quantity,unit_price_fils,total_fils FROM public.order_items WHERE order_id=ord LIMIT 1;
    RAISE EXCEPTION 'expected refund cap' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  INSERT INTO public.return_items(return_id,order_item_id,quantity,unit_price_fils,refund_amount_fils)
    SELECT another,id,quantity,unit_price_fils,total_fils-discount_fils FROM public.order_items WHERE order_id=ord LIMIT 1;
  BEGIN
    INSERT INTO public.return_items(return_id,order_item_id,quantity,unit_price_fils,refund_amount_fils)
      SELECT another,id,1,unit_price_fils,0 FROM public.order_items WHERE order_id=ord ORDER BY variant_id LIMIT 1;
    RAISE EXCEPTION 'expected return quantity cap' USING ERRCODE='XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  BEGIN PERFORM public.save_offer(NULL,'{}',gen_random_uuid()::text); RAISE EXCEPTION 'expected admin denial' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  INSERT INTO public.admin_users(user_id,role,is_active) VALUES('00000000-0000-4000-8000-000000000001','admin',true);
  q := jsonb_build_object('slug','admin-save-test','title','Admin save test','description','','terms','','status','draft','scope','all',
    'discount_type','percentage','discount_value',10,'product_ids','[]'::jsonb,'category_ids','[]'::jsonb,'min_order_fils',0);
  another := public.save_offer(NULL,q,'00000000-0000-4000-8000-000000000001');
  IF NOT EXISTS(SELECT 1 FROM public.audit_log WHERE entity_id=another AND action='offer_created') THEN RAISE EXCEPTION 'Missing offer audit'; END IF;
  PERFORM public.save_offer(another,q||'{"slug":"changed-link"}','00000000-0000-4000-8000-000000000001');
  IF NOT EXISTS(SELECT 1 FROM public.offers WHERE id=another AND slug='changed-link') THEN RAISE EXCEPTION 'Offer link was not updated'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.audit_log WHERE entity_id=another AND action='offer_updated' AND before_data->>'slug'='admin-save-test' AND after_data->>'slug'='changed-link') THEN RAISE EXCEPTION 'Missing offer rename audit'; END IF;
  BEGIN
    PERFORM public.save_offer(NULL,q||'{"slug":"changed-link"}','00000000-0000-4000-8000-000000000001');
    RAISE EXCEPTION 'expected duplicate slug rejection' USING ERRCODE='XX000';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  UPDATE public.admin_users SET is_active=false WHERE user_id='00000000-0000-4000-8000-000000000001';
  BEGIN PERFORM public.save_offer(another,q,'00000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'expected inactive admin denial' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  RAISE NOTICE 'Offer transaction assertions passed';
END $$;
ROLLBACK;
