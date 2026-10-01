-- 002_create_order_function.sql
-- Run AFTER 001. One transaction: idempotency check, stock check + decrement,
-- order + items insert, authoritative total. If anything fails, everything rolls back.
--
-- Errors raised (the API maps these by prefix):
--   INVALID_ITEMS, PRODUCT_NOT_FOUND, INSUFFICIENT_STOCK

create or replace function public.create_order(
  p_user_id uuid,
  p_idempotency_key text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address text,
  p_items jsonb   -- [{"productId":"<uuid>","quantity":2}, ...]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number bigint;
  v_total bigint := 0;
  v_item record;
  v_product record;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_ITEMS: cart is empty';
  end if;

  -- Idempotency: same user + same key = same order, never a duplicate.
  insert into orders (user_id, idempotency_key, customer_name, customer_email,
                      customer_phone, delivery_address, total_amount, status)
  values (p_user_id, p_idempotency_key, p_customer_name, p_customer_email,
          p_customer_phone, p_delivery_address, 0, 'pending')
  on conflict (user_id, idempotency_key) do nothing
  returning id, order_number into v_order_id, v_order_number;

  if v_order_id is null then
    select id, order_number into v_order_id, v_order_number
    from orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;

    return jsonb_build_object(
      'order_id', v_order_id, 'order_number', v_order_number, 'created', false
    );
  end if;

  -- Merge duplicate product lines; ORDER BY keeps lock order consistent (no deadlocks).
  for v_item in
    select (i->>'productId')::uuid as product_id,
           sum((i->>'quantity')::int) as quantity
    from jsonb_array_elements(p_items) as i
    group by 1
    order by 1
  loop
    if v_item.quantity < 1 then
      raise exception 'INVALID_ITEMS: quantity must be at least 1';
    end if;

    select id, name, price, stock into v_product
    from products
    where id = v_item.product_id
    for update;  -- lock the row so two buyers can't take the last unit

    if not found then
      raise exception 'PRODUCT_NOT_FOUND: %', v_item.product_id;
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'INSUFFICIENT_STOCK: % (only % left)', v_product.name, v_product.stock;
    end if;

    update products
    set stock = stock - v_item.quantity, updated_at = now()
    where id = v_product.id;

    insert into order_items (order_id, product_id, quantity, price)
    values (v_order_id, v_product.id, v_item.quantity, v_product.price);

    v_total := v_total + (v_product.price::bigint * v_item.quantity);
  end loop;

  update orders set total_amount = v_total where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id, 'order_number', v_order_number, 'created', true
  );
end;
$$;

-- Critical: this function trusts p_user_id, so browsers must NEVER be able to call it.
revoke all on function public.create_order(uuid, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_order(uuid, text, text, text, text, text, jsonb)
  to service_role;
