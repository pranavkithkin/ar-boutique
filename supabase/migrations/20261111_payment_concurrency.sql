-- Payment and stock concurrency safeguards.

ALTER TABLE public.stripe_events
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'processed';

ALTER TABLE public.stripe_events
  DROP CONSTRAINT IF EXISTS stripe_events_processing_status_check;

ALTER TABLE public.stripe_events
  ADD CONSTRAINT stripe_events_processing_status_check
  CHECK (processing_status IN ('processing', 'processed', 'failed'));

CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Stock quantity must be positive';
  END IF;

  UPDATE public.stock_levels
  SET reserved = reserved + p_quantity,
      updated_at = now()
  WHERE variant_id = p_variant_id
    AND on_hand - reserved >= p_quantity;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_reserved_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Stock quantity must be positive';
  END IF;

  UPDATE public.stock_levels
  SET reserved = GREATEST(0, reserved - p_quantity),
      updated_at = now()
  WHERE variant_id = p_variant_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_reserved_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Stock quantity must be positive';
  END IF;

  UPDATE public.stock_levels
  SET on_hand = on_hand - p_quantity,
      reserved = GREATEST(0, reserved - p_quantity),
      updated_at = now()
  WHERE variant_id = p_variant_id
    AND on_hand >= p_quantity
    AND reserved >= p_quantity;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fulfill_card_order(
  p_order_id uuid,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders%ROWTYPE;
  item record;
BEGIN
  SELECT * INTO current_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF current_order.status = 'confirmed' AND current_order.payment_status = 'paid' THEN
    RETURN false;
  END IF;

  FOR item IN
    SELECT variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
      AND variant_id IS NOT NULL
  LOOP
    UPDATE public.stock_levels
    SET on_hand = on_hand - item.quantity,
        reserved = GREATEST(0, reserved - item.quantity),
        updated_at = now()
    WHERE variant_id = item.variant_id
      AND on_hand >= item.quantity
      AND reserved >= item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Reserved stock is unavailable';
    END IF;
  END LOOP;

  UPDATE public.orders
  SET status = 'confirmed',
      payment_status = 'paid',
      confirmed_at = now(),
      paid_at = now(),
      stripe_session_id = p_stripe_session_id,
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_events (
    order_id, event_type, from_status, to_status, note, actor_sub
  ) VALUES (
    p_order_id,
    'card_payment_confirmed',
    current_order.status,
    'confirmed',
    'Payment confirmed via Stripe Checkout.',
    'stripe_webhook'
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_stock(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_reserved_stock(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_reserved_stock(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_reserved_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_reserved_stock(uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.fulfill_card_order(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_card_order(uuid, text, text) TO service_role;
