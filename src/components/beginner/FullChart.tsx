import { LETTERS, NEKUDOT, SOFIT_WITH_NEKUDA, withNekuda } from "@/data/beginner";

/** Every letter (rows) with every nekuda (columns), read right to left. */
export function FullChart() {
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table dir="rtl" className="min-w-full border-collapse text-center">
          <thead className="sticky top-0 bg-stone-50 text-xs text-stone-600">
            <tr>
              <th className="px-2 py-2 font-medium">Letter</th>
              {NEKUDOT.map((n) => (
                <th key={n.id} className="px-2 py-2 font-medium" dir="ltr">
                  {n.name}
                  <div className="text-[0.65rem] font-normal text-stone-400">{n.sound}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LETTERS.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <th className="px-2 py-1 font-hebrew text-3xl font-normal text-amber-800">
                  {l.char}
                  <div className="font-sans text-[0.65rem] text-stone-400" dir="ltr">
                    {l.name}
                  </div>
                </th>
                {NEKUDOT.map((n) => {
                  const g = withNekuda(l, n);
                  return (
                    <td key={n.id} lang="he" className="px-2 py-1 font-hebrew text-3xl text-stone-900">
                      {g ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-stone-200">
              <th className="px-2 py-1 font-hebrew text-3xl font-normal text-amber-800">
                ך
                <div className="font-sans text-[0.65rem] text-stone-400" dir="ltr">
                  Khaf Sofit
                </div>
              </th>
              {NEKUDOT.map((n) => (
                <td key={n.id} lang="he" className="px-2 py-1 font-hebrew text-3xl text-stone-900">
                  {SOFIT_WITH_NEKUDA.find((s) => s.nekuda === n.id)?.text ?? ""}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
