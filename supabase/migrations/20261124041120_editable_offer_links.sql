CREATE OR REPLACE FUNCTION public.save_offer(p_id uuid,p_data jsonb,p_actor text) RETURNS uuid
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
  END IF;
  INSERT INTO public.offers(id,slug,title,description,terms,status,discount_type,discount_value,scope,product_ids,category_ids,
    min_order_fils,max_discount_fils,usage_limit,per_customer_limit,starts_at,expires_at)
  VALUES(COALESCE(p_id,gen_random_uuid()),p_data->>'slug',p_data->>'title',p_data->>'description',p_data->>'terms',p_data->>'status',
    p_data->>'discount_type',(p_data->>'discount_value')::integer,p_data->>'scope',
    ARRAY(SELECT jsonb_array_elements_text(p_data->'product_ids')::uuid),ARRAY(SELECT jsonb_array_elements_text(p_data->'category_ids')::uuid),
    (p_data->>'min_order_fils')::integer,(p_data->>'max_discount_fils')::integer,(p_data->>'usage_limit')::integer,
    (p_data->>'per_customer_limit')::integer,(p_data->>'starts_at')::timestamptz,(p_data->>'expires_at')::timestamptz)
  ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,description=EXCLUDED.description,terms=EXCLUDED.terms,status=EXCLUDED.status,
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


