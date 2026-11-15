/**
 * Plans shown on the welcome page and /subscribe/.
 *
 * Individual plan: paid by card through Stripe. Set STRIPE_PAYMENT_LINK to the
 * Stripe Payment Link for the $10/month subscription (Stripe dashboard →
 * Payment Links). Until it's set, the page says payments open soon. After
 * paying, a Stripe webhook (supabase/functions/stripe-webhook) gives the account
 * access (profiles.role = 'family', paid_until = end of the paid month).
 * STRIPE_PORTAL_LINK is the Stripe customer portal link, for cancelling.
 */
export const INDIVIDUAL_PRICE = "$10";
export const INDIVIDUAL_PERIOD = "month";
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/3cIfZh1CL6J0d8KczT0VO00";
export const STRIPE_PORTAL_LINK = "https://billing.stripe.com/p/login/3cIfZh1CL6J0d8KczT0VO00";

export const INDIVIDUAL_FEATURES = [
  "All the te'amim, in 8 levels, with the Hazzan's recordings",
  "Practice: sing into the microphone and get stars",
  "Listening quiz",
  "The whole Torah with te'amim, every parasha and aliyah",
  "Torah Scroll Mode, line for line like a tikkun",
  "Slow down any recording without changing the tune",
];

export const SCHOOL_FEATURES = [
  "Accounts for every student, no email needed",
  "Teachers open the levels for each class",
  "See every child's progress in one place",
  "Priced per student per year",
];
