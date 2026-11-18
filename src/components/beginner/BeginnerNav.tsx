import Link from "next/link";

/** Breadcrumb for the beginner pages. */
export function BeginnerNav({ here }: { here?: string }) {
  return (
    <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
      <Link href="/" className="hover:underline">
        Keriah Trainer
      </Link>
      <span className="mx-1.5">/</span>
      {here ? (
        <>
          <Link href="/beginner/" className="hover:underline">
            Beginner Keriah
          </Link>
          <span className="mx-1.5">/</span>
          {here}
        </>
      ) : (
        "Beginner Keriah"
      )}
    </nav>
  );
}
