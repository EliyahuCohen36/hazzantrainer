import { MyBookmarks } from "@/lib/bookmarks";
import { HomeTabs } from "@/components/home/HomeTabs";

/** Home: the bookmarks, then the parts of the site as coloured tabs (Beginner Keriah, Tanach, Tefillah / Songs). */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <MyBookmarks />
      <h1 className="text-3xl font-semibold text-stone-900">Keriah Trainer</h1>
      <p className="mt-1 text-stone-600">Reading practice in the Syrian tradition.</p>
      <HomeTabs />
    </main>
  );
}
