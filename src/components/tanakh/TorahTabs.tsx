import Link from "next/link";

/** The two ways into the Torah: the Tikkun (reading training) and Shnayim Mikra ve-Ehad Targum. */
export function TorahTabs({ current }: { current: "tikkun" | "shnayim" }) {
  const tab = (id: "tikkun" | "shnayim", href: string, en: string, he: string, about: string) => (
    <Link
      href={href}
      aria-current={current === id ? "page" : undefined}
      className={`flex-1 rounded-2xl border p-4 shadow-sm transition-colors ${
        current === id ? "border-amber-500 bg-amber-50 ring-1 ring-amber-400" : "border-stone-200 bg-white hover:bg-stone-50"
      }`}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold text-stone-900">{en}</span>
        <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
          {he}
        </span>
      </span>
      <span className="mt-0.5 block text-sm text-stone-600">{about}</span>
    </Link>
  );
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      {tab("tikkun", "/tanakh/torah/", "Tikkun", "תיקון קוראים", "Torah reading training: te'amim, every parasha and aliyah, scroll mode.")}
      {tab(
        "shnayim",
        "/tanakh/torah/shnayim-mikra/",
        "Shnayim Mikra ve-Ehad Targum",
        "שנים מקרא ואחד תרגום",
        "Each pasuk twice, then the Targum (Onkelos), parasha by parasha.",
      )}
    </div>
  );
}
