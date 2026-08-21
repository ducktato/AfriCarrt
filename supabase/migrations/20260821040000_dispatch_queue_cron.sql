-- Every minute, ask the app to settle any order whose 10-minute stock-check
-- window has closed (capture, transfer, Uber dispatch). The target URL and
-- shared secret are looked up from Supabase Vault by name, not inlined here
-- -- this file is committed to the repo and must never contain a secret.
-- (Vault entries themselves are populated out-of-band, not via a migration.)
select cron.schedule(
  'process-dispatch-queue',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_target_base_url')
      || '/api/cron/process-dispatch-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
