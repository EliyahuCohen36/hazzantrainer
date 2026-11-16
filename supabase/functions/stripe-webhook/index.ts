// Stripe → Supabase: gives an account access when its subscription is paid
// ($12/month or $100/year).
//
// Deploy: Supabase dashboard → Edge Functions → Deploy a new function → "stripe-webhook",
// paste this file, and turn OFF "Verify JWT" (Stripe can't send a Supabase token;
// the Stripe signature is checked instead).
// Secret (Edge Functions → Secrets): STRIPE_WEBHOOK_SECRET (the destination's signing
// secret). No Stripe API key is needed: the function only checks the signature and
// reads the event.
// In Stripe: Developers → Webhooks → add endpoint
//   https://<project>.supabase.co/functions/v1/stripe-webhook
// with events: checkout.session.completed, invoice.paid.
//
// The Payment Link is opened with ?client_reference_id=<the user's id>, so the
// first payment says whose account it is. Later renewals find the account by
// its Stripe customer id. When a subscription is cancelled, access simply runs
// until the end of the month that was paid for (paid_until).
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Only used to check signatures, so no real API key is needed.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "sk_unused", { httpClient: Stripe.createFetchHttpClient() });
// The project's secret key (new-style keys), or the legacy service_role key.
function secretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch {
    // fall through
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
const db = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), { auth: { persistSession: false } });

const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);
/** A month (or a year) from now plus a few days' grace (invoice.paid sets the exact date). */
const fromNow = (months: number) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + 3);
  return d.toISOString().slice(0, 10);
};

/** Give access until `until` (keeps teachers, students and the admin as they are). */
async function grant(filter: { id?: string; customer?: string }, until: string, customer?: string) {
  let q = db.from("profiles").select("id, role, paid_until");
  q = filter.id ? q.eq("id", filter.id) : q.eq("stripe_customer_id", filter.customer!);
  const { data: p } = await q.maybeSingle();
  if (!p) return console.warn("No account for", filter);
  const patch: Record<string, unknown> = {
    paid_until: p.paid_until && p.paid_until > until ? p.paid_until : until,
  };
  if (p.role === "none" || p.role === "family") patch.role = "family";
  if (customer) patch.stripe_customer_id = customer;
  const { error } = await db.from("profiles").update(patch).eq("id", p.id);
  if (error) console.error(error);
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (e) {
    return new Response(`Bad signature: ${(e as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.client_reference_id && (s.subscription || s.mode === "subscription")) {
      // The yearly price ($100) pays for 12 months; the monthly one for 1.
      const yearly = (s.amount_total ?? 0) >= 5000;
      await grant({ id: s.client_reference_id }, fromNow(yearly ? 12 : 1), s.customer as string);
    }
  } else if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;
    const end = inv.lines.data[0]?.period?.end;
    if (inv.customer && end) await grant({ customer: inv.customer as string }, day(end));
  }
  return new Response("ok");
});
