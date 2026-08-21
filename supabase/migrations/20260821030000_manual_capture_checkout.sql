-- Switch checkout to a buffered manual-capture PaymentIntent: authorize
-- subtotal*1.20 + delivery fee at checkout, capture the real final amount
-- once the 10-minute stock-check window closes (Feature 2). Order creation
-- happens at authorization time (so the store can start packing right
-- away); the Stripe Transfer and Uber Direct dispatch move to capture time.

alter table public.orders
  add column authorized_amount numeric(10, 2),
  add column captured_at timestamptz,
  add column dispatch_at timestamptz;
