import { CONTACT_EMAIL } from "@/data/demo";

/** "Questions? Email us": for schools and students. */
export function ContactBox() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
      <h2 className="text-lg font-semibold text-stone-900">Questions? Bringing it to your school?</h2>
      <p className="mt-1 text-sm text-stone-700">Schools and students can send any inquiry to</p>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=Keriah%20Trainer%20inquiry`}
        className="mt-2 inline-block font-semibold text-amber-800 underline"
      >
        {CONTACT_EMAIL}
      </a>
    </div>
  );
}
