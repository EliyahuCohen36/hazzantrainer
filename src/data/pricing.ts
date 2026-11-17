/**
 * Plans shown on the welcome page and /subscribe/.
 *
 * Individual plan: paid by card through Stripe, $12 a month or $100 a year.
 * STRIPE_PAYMENT_LINK / STRIPE_YEARLY_LINK are the Stripe Payment Links for the
 * two prices (Stripe dashboard → Payment Links). Until one is set, that option
 * says payments open soon. After
 * paying, a Stripe webhook (supabase/functions/stripe-webhook) gives the account
 * access (profiles.role = 'family', paid_until = end of the paid month).
 * STRIPE_PORTAL_LINK is the Stripe customer portal link, for cancelling.
 */
export const INDIVIDUAL_PRICE = "$12";
export const INDIVIDUAL_PERIOD = "month";
export const YEARLY_PRICE = "$100";
/** What the yearly plan saves against 12 months. */
export const YEARLY_SAVING = "save $44";
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/7sYbJ10yH5EW2u6fM50VO01";
export const STRIPE_YEARLY_LINK = "https://buy.stripe.com/eVq00jdlt0kC3ya7fz0VO02";
export const STRIPE_PORTAL_LINK = "https://billing.stripe.com/p/login/3cIfZh1CL6J0d8KczT0VO00";

/** Everything in the monthly subscription, in two groups (shown on the welcome, sign-in and subscribe pages). */
export const BEGINNER_FEATURES = [
  "Every letter of the alef-bet, with the Hazzan saying its name and sound",
  "Every letter with every nekuda, read in the Syrian way",
  "Practice words from the Torah, one sound at a time, with stars",
  "The Sheva Na and Sheva Nach, once the nekudot are learned",
];

export const TORAH_FEATURES = [
  "All the te'amim, in 8 levels, with the Hazzan's recordings",
  "Practice: sing into the microphone and get stars",
  "Listening quiz",
  "The whole Torah with te'amim, every parasha and aliyah",
  "Torah Scroll Mode, line for line like a tikkun",
  "Slow down any recording without changing the tune",
];

export const INDIVIDUAL_FEATURES = [...BEGINNER_FEATURES, ...TORAH_FEATURES];

export const SCHOOL_FEATURES = [
  "Accounts for every student, no email needed",
  "Teachers open the levels for each class",
  "See every child's progress in one place",
  "Priced per student per year",
];
