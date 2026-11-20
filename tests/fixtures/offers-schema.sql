-- Minimal local-only schema contract for the campaign transaction tests.
-- Catalogue values below are copied exactly from the existing catalogue, never generated.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
CREATE TABLE settings(id boolean PRIMARY KEY, cod_enabled boolean, cod_signed_in_only boolean,
 cod_refusal_limit integer,free_delivery_threshold_fils integer,delivery_fee_fils integer,cod_fee_fils integer,
 cod_max_order_fils integer,vat_enabled boolean,vat_rate_bps integer,cod_confirm_hours integer,notification_emails text[]);
CREATE TABLE categories(id uuid PRIMARY KEY,name text);
CREATE TABLE colours(id uuid PRIMARY KEY,name text);
CREATE TABLE sizes(id uuid PRIMARY KEY,label text);
CREATE TABLE products(id uuid PRIMARY KEY,name text,status text,is_final_sale boolean DEFAULT false,category_id uuid,created_at timestamptz DEFAULT now());
CREATE TABLE product_colours(id uuid PRIMARY KEY,product_id uuid,colour_id uuid,is_active boolean,style_code text);
CREATE TABLE product_variants(id uuid PRIMARY KEY,product_id uuid,product_colour_id uuid,sku text,price_fils integer,is_active boolean,size_id uuid);
CREATE TABLE product_images(id uuid PRIMARY KEY,product_colour_id uuid,media_key text,sort integer);
CREATE TABLE stock_levels(variant_id uuid PRIMARY KEY,on_hand integer,reserved integer,updated_at timestamptz);
CREATE TABLE customers(email text PRIMARY KEY,full_name text,phone text,clerk_user_id text,cod_disabled boolean DEFAULT false,updated_at timestamptz);
CREATE TABLE orders(id uuid PRIMARY KEY,order_number text,checkout_key uuid UNIQUE,checkout_request_hash text,
 clerk_user_id text,email text,customer_name text,phone text,emirate text,area text,street_address text,building text,
 apartment text,landmark text,internal_notes text,status text,payment_method text,payment_status text,subtotal_fils integer,
 discount_fils integer,delivery_fee_fils integer,cod_fee_fils integer,vat_fils integer,total_fils integer,vat_rate_bps integer,
 confirm_by timestamptz,hold_expires_at timestamptz,stock_released_at timestamptz,stock_consumed_at timestamptz,
 cancelled_at timestamptz,confirmed_at timestamptz,paid_at timestamptz,updated_at timestamptz,stripe_session_id text,stripe_payment_intent_id text);
CREATE TABLE order_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid REFERENCES orders(id),variant_id uuid,
 product_id uuid,product_colour_id uuid,sku text,product_name text,colour_name text,style_code text,size_label text,
 unit_price_fils integer,quantity integer,total_fils integer,is_final_sale boolean,media_key text);
CREATE TABLE order_events(id uuid DEFAULT gen_random_uuid(),order_id uuid,event_type text,from_status text,to_status text,note text,actor_sub text);
CREATE TABLE coupons(id uuid PRIMARY KEY,code text,is_active boolean,starts_at timestamptz,expires_at timestamptz,usage_limit integer,
 usage_count integer,min_order_fils integer,per_customer_limit integer,discount_type text,discount_value numeric,max_discount_fils integer,updated_at timestamptz);
CREATE TABLE coupon_redemptions(coupon_id uuid,order_id uuid,customer_email text,clerk_user_id text,discount_fils integer);
CREATE TABLE admin_users(user_id uuid,role text,is_active boolean);
CREATE TABLE return_requests(id uuid PRIMARY KEY,order_id uuid,status text);
CREATE TABLE return_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),return_id uuid REFERENCES return_requests(id),order_item_id uuid,
 quantity integer,unit_price_fils integer,refund_amount_fils integer);
CREATE TABLE audit_log(id uuid DEFAULT gen_random_uuid(),actor_sub text,action text,entity_type text,entity_id uuid,before_data jsonb,after_data jsonb);
CREATE TABLE stripe_events(id text PRIMARY KEY);
CREATE SEQUENCE order_number_seq;
CREATE FUNCTION next_order_number() RETURNS text LANGUAGE sql SET search_path=public AS $$ SELECT 'AR-'||nextval('public.order_number_seq'); $$;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
INSERT INTO settings VALUES(true,true,false,3,20000,2500,500,500000,true,500,24,'{}');
INSERT INTO categories VALUES('1377e04f-2293-429b-b5f6-484028d9bb8c','Top');
INSERT INTO colours VALUES('41d97e2b-7c75-477b-8a6e-a339d216f376','Black'),('3a331048-78e7-416c-b3f2-8c839c06769d','Sage');
INSERT INTO products(id,name,status,category_id) VALUES
 ('be7da261-1489-4137-92e9-8bd95750eeb2','Top AR4207','published','1377e04f-2293-429b-b5f6-484028d9bb8c'),
 ('80f5b091-e43f-4398-a51b-4376cf78c8cc','Top AR4380','published','1377e04f-2293-429b-b5f6-484028d9bb8c');
INSERT INTO product_colours VALUES
 ('efbe2b76-7185-4a58-bef8-4c2c3ddafc11','be7da261-1489-4137-92e9-8bd95750eeb2','41d97e2b-7c75-477b-8a6e-a339d216f376',true,'JNE4207'),
 ('7c8348b6-a681-4450-bc30-dc7e7e2e34a6','80f5b091-e43f-4398-a51b-4376cf78c8cc','3a331048-78e7-416c-b3f2-8c839c06769d',true,'JNE4380');
INSERT INTO product_variants VALUES
 ('01581467-7bb3-4717-96d4-298132d8a06d','be7da261-1489-4137-92e9-8bd95750eeb2','efbe2b76-7185-4a58-bef8-4c2c3ddafc11','AR4207-TP-L',8000,true,null),
 ('0213a7a0-c8c6-4b83-8ca3-9f0469363e10','80f5b091-e43f-4398-a51b-4376cf78c8cc','7c8348b6-a681-4450-bc30-dc7e7e2e34a6','AR4380-TP-M',8700,true,null);
INSERT INTO stock_levels SELECT id,100,0,now() FROM product_variants;
