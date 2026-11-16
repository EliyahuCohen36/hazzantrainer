-- Individual subscriptions ($12/month or $100/year by Stripe). Run once after schema.sql; safe to re-run.
alter table public.profiles add column if not exists stripe_customer_id text unique;
