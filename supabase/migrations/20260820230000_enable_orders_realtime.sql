-- Lets the order tracking page subscribe to live status changes (driven by
-- Uber Direct webhooks) via Supabase Realtime instead of polling. Realtime
-- still respects RLS, so this doesn't widen who can see an order.
alter publication supabase_realtime add table public.orders;
