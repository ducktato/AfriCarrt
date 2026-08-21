-- Feature 2: store-owner flags an unavailable item during the 10-minute
-- stock-check window; customer picks a substitute or accepts a refund;
-- unresolved flags auto-refund when the window closes (see
-- /api/cron/process-dispatch-queue, extended to capture the net amount).

alter table public.order_items
  add column availability_status text not null default 'available'
    check (availability_status = any (array[
      'available', 'flagged', 'resolved_substitute', 'resolved_refund'
    ])),
  add column flagged_at timestamptz,
  add column resolved_at timestamptz,
  add column substitute_listing_id uuid references public.store_listings (id),
  -- What this line actually costs after resolution: substitute's price for
  -- resolved_substitute, 0 for resolved_refund, null (= price_at_purchase)
  -- while still 'available' or 'flagged'.
  add column effective_price numeric(10, 2);

-- No UPDATE policy existed on order_items at all (only insert-at-creation
-- and select). Store owners need to flag items; customers need to resolve
-- them. Fine-grained state-machine rules (only flag if available, only
-- resolve if flagged, only within the window) are enforced in the server
-- actions, same pattern as the rest of this schema.
create policy "order_items_update_involved" on public.order_items
  for update using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = auth.uid()
          or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
          or public.is_admin()
        )
    )
  );
