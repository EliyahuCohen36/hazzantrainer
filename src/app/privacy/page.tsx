import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/data/demo";

export const metadata: Metadata = { title: "Privacy · Keriah Trainer" };

/** Privacy policy (open to everyone; Google sign-in needs one). */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-stone-800">
      <h1 className="text-3xl font-semibold text-stone-900">Privacy</h1>
      <p className="mt-4">Keriah Trainer keeps only what it needs to run your account and your learning.</p>
      <h2 className="mt-6 text-xl font-semibold text-stone-900">What we keep</h2>
      <ul className="mt-2 list-disc space-y-1 ps-5">
        <li>Your name, and your email or username, so you can sign in. With Google sign-in we receive only your name and email address from Google.</li>
        <li>Your school and class, if you learn through a school.</li>
        <li>Your progress: which lessons you finished and your scores, so you and your teacher can see how you are doing.</li>
        <li>For personal subscriptions, whether your subscription is paid. Card payments are handled by Stripe; we never see or keep card numbers.</li>
      </ul>
      <h2 className="mt-6 text-xl font-semibold text-stone-900">How it is used</h2>
      <p className="mt-2">
        Only to run Keriah Trainer: signing in, opening the right lessons, and showing progress to the student and their
        teacher. We do not sell or share your information, show ads, or use it for anything else. Recordings of your voice
        are checked on your own device and are not saved or sent anywhere.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-stone-900">Where it is kept</h2>
      <p className="mt-2">Accounts and progress are stored securely with Supabase. You can ask us to delete your account and everything in it at any time.</p>
      <h2 className="mt-6 text-xl font-semibold text-stone-900">Contact</h2>
      <p className="mt-2">
        Questions or requests: <a className="text-amber-800 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  );
}
