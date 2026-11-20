"use client";

import { useState } from "react";
import Link from "next/link";
import { asset } from "@/lib/base-path";
import { useLang } from "@/lib/i18n/Translator";
import type { Lang } from "@/lib/i18n/translate";
import { ContactBox } from "@/components/ContactBox";

/* The About page in English, Hebrew and Arabic (the pictures too), written out in full. */

interface Text {
  kicker: string;
  title: string;
  intro: string;
  meet: string;
  name: string;
  bio: React.ReactNode[];
  startedTitle: string;
  started: string[];
  diffTitle: string;
  diff: [string, string][];
  nextTitle: string;
  next: string;
  thanksTitle: string;
  thanks: string[];
  demo: string;
  plans: string;
  shot1: string;
  shot2: string;
  tabMe: string;
  tabSite: string;
  featuresTitle: string;
  features: [string, string][];
}

const T: Record<Lang, Text> = {
  en: {
    kicker: "קריאת התורה · מנהג ארם צובא",
    title: "About Keriah Trainer",
    intro:
      "A Torah reading trainer made in and for the Syrian community, so every child can learn to read the Torah the way it's read in our synagogues.",
    meet: "Meet Eliyahu Cohen",
    name: "Eliyahu Cohen",
    bio: [
      <>
        Eliyahu Cohen is an experienced Hazzan and teacher in the community. He learned Qeriah and Hazzanut from a young age
        under the guidance of his great-uncles, <b>Meyer &ldquo;Mickey&rdquo; Kairey a&quot;h</b> and{" "}
        <b>Isaac &ldquo;Cabby&rdquo; Cabasso a&quot;h</b>.
      </>,
      <>
        Whether it&apos;s a Bar Mitzvah part, a pizmon or a section of the Tefillah, he puts his full effort into making sure
        every learner can learn it confidently and show off their newly acquired skills. Just as his teachers taught him the
        importance of keeping the traditions, Eliyahu is passing these teachings down to the next generation of Hazzanim in
        the community.
      </>,
      <>
        He has been teaching Keriah for <b>over 10 years</b>, including Qeriah and Pizmonim at{" "}
        <b>Barkai Yeshiva Elementary School</b>, and is an active Hazzan and Qoreh across the SY community. He holds a{" "}
        <b>BA in Judaic Studies and Education from CUNY Brooklyn College</b>.
      </>,
    ],
    startedTitle: "How it started",
    started: [
      "Children learning to read the Torah in our tradition, the tradition of Aram Tsoba (Aleppo), had very little to practice with at home. Most of the apps and recordings out there teach the Ashkenazi tunes, and even call the te'amim by other names: what we call Kadma, they call Pashta.",
      "So Eliyahu recorded every ta'am himself, in the Syrian melody, and built a trainer around those recordings. Children hear each ta'am exactly the way it's sung in shul, learn it level by level, and school students record it for their teacher, who gives a grade. Then they read real pesukim, then whole aliyot, and finally a page of the Sefer Torah itself.",
    ],
    diffTitle: "What makes it different",
    diff: [
      ["Syrian names and tunes", "Every ta'am has its Syrian name, as used by the Sephardic Pizmonim Project, and is sung in the Syrian melody."],
      ["A real voice, not a machine", "Every recording is a person singing, not a computer. Slow it down as much as you need: the tune stays the same."],
      ["One step at a time", "One ta'am per level, easiest first. Teachers open the next level when the class is ready, so no one is overwhelmed."],
      ["From the book to the scroll", "Read with nikkud and te'amim, then switch to Torah Scroll Mode: the real columns of a Sefer Torah, in Sephardic letters with their crowns."],
    ],
    nextTitle: "What's next",
    next: "The whole Siddur with the Hazzan's recordings, Shnayim Mikra ve-Ehad Targum, and more nusachim recorded by Hazzanim of each tradition.",
    thanksTitle: "With thanks",
    thanks: [
      "Te'amim names: the Sephardic Pizmonim Project (pizmonim.org).",
      "Tanakh text: Miqra According to the Masorah, from Hebrew Wikisource (CC BY-SA 4.0), with the Sephardic scroll spellings.",
      "Targum Onkelos (Yemenite Taj vocalization): Hebrew Wikisource (CC BY-SA 4.0).",
      "Siddur Edot HaMizrah: Torat Emet, via Sefaria.",
      "Sefer Torah column layout: tikkun.io (MIT licence).",
      "Scroll letters: Stam Sefarad CLM by Yoram Gnat, Culmus Project (GPL with font exception).",
    ],
    demo: "Try the free demo",
    plans: "See the plans",
    shot1: "The te'amim trainer",
    shot2: "Shirat HaYam in Torah Scroll Mode",
    tabMe: "About me",
    tabSite: "What the website does",
    featuresTitle: "Everything on Keriah Trainer",
    features: [
      ["Beginner Keriah", "For first-time readers: the alef-bet (with tracing), the final letters, every nekuda with every letter, practice words, then the Sheva, Qamats Katan, Patah Genuva, Dagesh and the four kinds of He, one level at a time."],
      ["The te'amim trainer", "Every ta'am in the Syrian melody, one per level, with examples from the Torah. School students record each ta'am for their teacher, who grades it."],
      ["The whole Tanakh", "Every parasha, aliyah, haftarah and chapter of Nevi'im and Ketuvim, with nikkud, te'amim, the ma'amid and the Sheva Na marked, and a translation under each pasuk."],
      ["Torah Scroll Mode with a tikkun", "The real columns of a Sefer Torah in Sephardic letters, with the vowelled column beside it, and the five megillot as scrolls."],
      ["The Siddur", "The whole Siddur Edot HaMizrah, with recordings for many of its parts and the Shabbat tunes in each maqam."],
      ["For teachers", "Classes with their own codes, levels opened when the class is ready, how many questions each lesson asks, grades worked out automatically, and the te'amim recordings to grade."],
    ],
  },
  he: {
    kicker: "קריאת התורה · מנהג ארם צובא",
    title: "אודות מאמן הקריאה",
    intro: "מאמן לקריאה בתורה שנבנה בקהילה הסורית ובשבילה, כדי שכל ילד יוכל ללמוד לקרוא בתורה כפי שקוראים בבתי הכנסת שלנו.",
    meet: "הכירו את אליהו כהן",
    name: "אליהו כהן",
    bio: [
      <>
        אליהו כהן הוא חזן ומורה ותיק בקהילה. הוא למד קריאה וחזנות מגיל צעיר בהדרכת אחי סבו, <b>מאיר (מיקי) קיירי ע״ה</b> ו
        <b>יצחק (קבי) קבסו ע״ה</b>.
      </>,
      <>
        בין אם זו קריאת בר מצווה, פזמון או קטע מהתפילה, הוא משקיע את כל כולו כדי שכל תלמיד ילמד בביטחון ויוכל להראות את מה
        שרכש. כשם שרבותיו לימדו אותו את חשיבות שמירת המסורת, אליהו מעביר את התורה הזאת לדור הבא של החזנים בקהילה.
      </>,
      <>
        הוא מלמד קריאה <b>יותר מ-10 שנים</b>, בהן קריאה ופזמונים ב<b>בית הספר היסודי ישיבת ברקאי</b>, והוא חזן וקורא פעיל
        בכל הקהילה הסורית. הוא בעל <b>תואר ראשון במדעי היהדות ובחינוך מ-CUNY Brooklyn College</b>.
      </>,
    ],
    startedTitle: "איך זה התחיל",
    started: [
      "לילדים שלומדים לקרוא בתורה במסורת שלנו, מסורת ארם צובא (חלב), היה מעט מאוד לתרגל איתו בבית. רוב האפליקציות וההקלטות מלמדות את הלחנים האשכנזיים, ואפילו קוראות לטעמים בשמות אחרים: מה שאנחנו קוראים קדמא, הם קוראים פשטא.",
      "לכן אליהו הקליט בעצמו כל טעם, בלחן הסורי, ובנה סביב ההקלטות האלה מאמן. הילדים שומעים כל טעם בדיוק כפי שהוא מושר בבית הכנסת, לומדים אותו שלב אחר שלב, ותלמידי בתי ספר מקליטים אותו למורה שנותן ציון. אחר כך הם קוראים פסוקים אמיתיים, אחר כך עליות שלמות, ולבסוף עמוד מספר התורה עצמו.",
    ],
    diffTitle: "מה מיוחד בזה",
    diff: [
      ["שמות ולחנים סוריים", "לכל טעם השם הסורי שלו, כפי שמופיע בפרויקט הפזמונים הספרדי, והוא מושר בלחן הסורי."],
      ["קול אמיתי, לא מכונה", "כל הקלטה היא אדם ששר, לא מחשב. אפשר להאט כמה שצריך: הלחן נשאר אותו לחן."],
      ["צעד אחר צעד", "טעם אחד בכל שלב, מהקל אל הקשה. המורים פותחים את השלב הבא כשהכיתה מוכנה, כך שאף אחד לא מוצף."],
      ["מהחומש אל הספר", "קוראים עם ניקוד וטעמים, ואז עוברים למצב ספר תורה: העמודות האמיתיות של ספר תורה, באותיות ספרדיות עם התגים."],
    ],
    nextTitle: "מה הלאה",
    next: "כל הסידור עם ההקלטות של החזן, שנים מקרא ואחד תרגום, ועוד נוסחים בהקלטות של חזנים מכל מסורת.",
    thanksTitle: "בתודה",
    thanks: [
      "שמות הטעמים: פרויקט הפזמונים הספרדי (pizmonim.org).",
      "נוסח התנ״ך: מקרא על פי המסורה, מוויקיטקסט (CC BY-SA 4.0), עם הכתיב של ספר תורה ספרדי.",
      "תרגום אונקלוס (ניקוד התאג׳ התימני): ויקיטקסט (CC BY-SA 4.0).",
      "סידור עדות המזרח: תורת אמת, דרך ספריא.",
      "פריסת העמודות של ספר התורה: tikkun.io (רישיון MIT).",
      "אותיות הספר: סת״ם ספרד CLM מאת יורם גנת, פרויקט קולמוס (GPL עם חריגת גופנים).",
    ],
    demo: "נסו את ההדגמה החינמית",
    plans: "ראו את המסלולים",
    shot1: "מאמן הטעמים",
    shot2: "שירת הים במצב ספר תורה",
    tabMe: "עליי",
    tabSite: "מה יש באתר",
    featuresTitle: "כל מה שיש בקריאה טריינר",
    features: [
      ["קריאה למתחילים", "לקוראים חדשים: האלף־בית (עם עקיבה בכתיבה), האותיות הסופיות, כל ניקוד עם כל אות, מילים לתרגול, ואחר כך השווא, הקמץ הקטן, הפתח הגנובה, הדגש וארבעת סוגי ה״א, שלב אחר שלב."],
      ["מאמן הטעמים", "כל טעם בלחן הסורי, טעם אחד בכל שלב, עם דוגמאות מהתורה. תלמידי בתי ספר מקליטים כל טעם למורה, שנותן ציון."],
      ["כל התנ״ך", "כל פרשה, עלייה, הפטרה וכל פרק בנביאים ובכתובים, עם ניקוד, טעמים, מעמיד ושווא נע מסומן, ותרגום מתחת לכל פסוק."],
      ["מצב ספר תורה עם תיקון", "העמודות האמיתיות של ספר תורה בכתב ספרדי, עם עמודה מנוקדת לידה, וחמש המגילות כמגילות."],
      ["הסידור", "כל סידור עדות המזרח, עם הקלטות להרבה מחלקיו ולחני שבת בכל מקאם."],
      ["למורים", "כיתות עם קוד משלהן, שלבים שנפתחים כשהכיתה מוכנה, כמה שאלות שואל כל שיעור, ציונים שמחושבים לבד, והקלטות הטעמים לבדיקה."],
    ],
  },
  ar: {
    kicker: "קריאת התורה · מנהג ארם צובא",
    title: "عن مدرّب القراءة",
    intro: "مدرّب لقراءة التوراة صُنع في الجالية السورية ومن أجلها، لكي يتعلّم كل طفل قراءة التوراة كما تُقرأ في كُنُسنا.",
    meet: "تعرّف على إلياهو كوهين",
    name: "إلياهو كوهين",
    bio: [
      <>
        إلياهو كوهين حزّان ومعلّم ذو خبرة في الجالية. تعلّم القراءة والحزّانوت منذ صغره بإرشاد أخوال أبيه،{" "}
        <b>مئير (ميكي) كيري رحمه الله</b> و<b>إسحاق (كابي) كاباسو رحمه الله</b>.
      </>,
      <>
        سواء كانت قراءة بار متسفاه أو بزمون أو جزءاً من الصلاة، يبذل كل جهده لكي يتعلّم كل طالب بثقة ويُظهر ما اكتسبه. وكما
        علّمه أساتذته أهمية الحفاظ على التقاليد، ينقل إلياهو هذه التعاليم إلى الجيل القادم من الحزّانيم في الجالية.
      </>,
      <>
        يعلّم القراءة منذ <b>أكثر من 10 سنوات</b>، منها القراءة والبزمونيم في <b>مدرسة يشيفات بركاي الابتدائية</b>، وهو حزّان
        وقارئ نشيط في الجالية السورية كلها. يحمل <b>بكالوريوس في الدراسات اليهودية والتربية من كلية بروكلين (CUNY)</b>.
      </>,
    ],
    startedTitle: "كيف بدأ",
    started: [
      "الأطفال الذين يتعلّمون قراءة التوراة حسب تقليدنا، تقليد آرام صوبا (حلب)، لم يكن لديهم ما يتمرّنون به في البيت. معظم التطبيقات والتسجيلات تعلّم الألحان الأشكنازية، بل وتسمّي الطعميم بأسماء أخرى: ما نسمّيه قدما يسمّونه بشطا.",
      "لذلك سجّل إلياهو بنفسه كل طعم باللحن السوري، وبنى حول هذه التسجيلات مدرّباً. يسمع الأطفال كل طعم تماماً كما يُغنّى في الكنيس، ويتعلّمونه مستوى بعد مستوى، ويسجّله طلاب المدارس لمعلّمهم الذي يعطيهم علامة. ثم يقرؤون آيات حقيقية، ثم عاليوت كاملة، وأخيراً صفحة من سفر التوراة نفسه.",
    ],
    diffTitle: "ما الذي يميّزه",
    diff: [
      ["أسماء وألحان سورية", "لكل طعم اسمه السوري كما في مشروع البزمونيم السفاردي، ويُغنّى باللحن السوري."],
      ["صوت حقيقي، لا آلة", "كل تسجيل هو إنسان يغنّي، لا حاسوب. أبطئه قدر ما تحتاج: يبقى اللحن نفسه."],
      ["خطوة خطوة", "طعم واحد في كل مستوى، من الأسهل إلى الأصعب. يفتح المعلّمون المستوى التالي عندما يكون الصف مستعداً، فلا يُرهَق أحد."],
      ["من الكتاب إلى اللفافة", "اقرأ مع الحركات والطعميم، ثم انتقل إلى وضع سفر التوراة: الأعمدة الحقيقية لسفر التوراة، بالحروف السفاردية مع تيجانها."],
    ],
    nextTitle: "ما التالي",
    next: "السدّور كاملاً بتسجيلات الحزّان، و«شنايم مقرا وإحاد ترجوم»، ونوسحات أخرى بتسجيلات حزّانيم من كل تقليد.",
    thanksTitle: "مع الشكر",
    thanks: [
      "أسماء الطعميم: مشروع البزمونيم السفاردي (pizmonim.org).",
      "نص التناخ: «المقرا حسب الماسورا» من ويكي مصدر العبري (CC BY-SA 4.0)، بكتابة سفر التوراة السفاردي.",
      "ترجوم أونقلوس (بتشكيل التاج اليمني): ويكي مصدر العبري (CC BY-SA 4.0).",
      "سدّور عيدوت هامزراح: توراة إيميت، عبر سفاريا.",
      "ترتيب أعمدة سفر التوراة: tikkun.io (رخصة MIT).",
      "حروف اللفافة: Stam Sefarad CLM ليورام غنات، مشروع كولموس (GPL مع استثناء الخطوط).",
    ],
    demo: "جرّب العرض المجاني",
    plans: "اطّلع على الخطط",
    shot1: "مدرّب الطعميم",
    shot2: "شيرات هايام في وضع سفر التوراة",
    tabMe: "عنّي",
    tabSite: "ماذا يقدّم الموقع",
    featuresTitle: "كل ما في مدرّب القراءة",
    features: [
      ["القراءة للمبتدئين", "للقرّاء الجدد: الأبجدية (مع تتبّع الكتابة)، الحروف النهائية، كل حركة مع كل حرف، كلمات للتمرين، ثم الشڤا والقامتس القصير والفتحة المسروقة والداگيش وأنواع الهاء الأربعة، مستوى بعد مستوى."],
      ["مدرّب الطعاميم", "كل طعم باللحن السوري، طعم واحد في كل مستوى، مع أمثلة من التوراة. يسجّل طلاب المدارس كل طعم لمعلّمهم الذي يعطيهم علامة."],
      ["التناخ كله", "كل پاراشا وعلياه وهفطارا وكل فصل من الأنبياء والكتب، بالحركات والطعاميم والمعميد والشڤا الناطق مميّزاً، وترجمة تحت كل آية."],
      ["وضع سفر التوراة مع التيكون", "الأعمدة الحقيقية لسفر التوراة بالخط السفاردي، مع عمود مشكول بجانبها، والمجلّات الخمس كلفائف."],
      ["السيدور", "سيدور عيدوت هامزراح كاملاً، مع تسجيلات لكثير من أجزائه وألحان السبت في كل مقام."],
      ["للمعلّمين", "صفوف برموز خاصة بها، مستويات تُفتح عندما يكون الصف جاهزاً، عدد أسئلة كل درس، علامات تُحسب تلقائياً، وتسجيلات الطعاميم للتقييم."],
    ],
  },
};

function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-300/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt={alt} className="block w-full" loading="lazy" />
    </figure>
  );
}

/** Pictures of the site in the reader's language (screenshots taken in each language). */
const shot = (name: string, lang: Lang) => `/images/${name}${lang === "en" ? "" : `-${lang}`}.webp`;

export function AboutContent() {
  const { lang } = useLang();
  const t = T[lang];
  // Two tabs (owner, Nov 20): about Eliyahu, and what the website does.
  const [tab, setTab] = useState<"me" | "site">("me");
  return (
    // Written out in each language (the translator has nothing left to change).
    <main>
      <section className="bg-gradient-to-b from-amber-50 to-[#faf8f5]">
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-10 text-center">
          <p dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            {t.kicker}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-700">{t.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <div role="tablist" className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
          {(
            [
              ["me", t.tabMe],
              ["site", t.tabSite],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2.5 text-lg font-semibold ${tab === id ? "bg-white text-amber-900 shadow" : "text-stone-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "me" ? (
          <div className="space-y-12">
        <div className="grid items-start gap-8 sm:grid-cols-[14rem_1fr]">
          <figure className="mx-auto w-48 sm:w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset("/images/eliyahu-cohen.webp")}
              alt={t.name}
              className="aspect-[3/4] w-full rounded-2xl object-cover shadow-lg shadow-stone-300/50"
            />
            <figcaption className="mt-2 text-center text-sm font-medium text-stone-700">{t.name}</figcaption>
          </figure>
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">{t.meet}</h2>
            <div className="mt-3 space-y-4 text-stone-700">
              {t.bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-stone-900">{t.startedTitle}</h2>
          <div className="mt-3 space-y-4 text-stone-700">
            {t.started.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

          </div>
        ) : (
          <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">{t.featuresTitle}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {t.features.map(([h, d]) => (
              <li key={h} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                <h3 className="font-semibold text-stone-900">{h}</h3>
                <p className="mt-1 text-sm text-stone-700">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <Shot src={shot("teamim-levels", lang)} alt={t.shot1} />

        <div>
          <h2 className="text-2xl font-semibold text-stone-900">{t.diffTitle}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {t.diff.map(([h, d]) => (
              <li key={h} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-stone-900">{h}</h3>
                <p className="mt-1 text-sm text-stone-600">{d}</p>
              </li>
            ))}
          </ul>
        </div>

        <Shot src={shot("shirat-hayam", lang)} alt={t.shot2} />

        <div>
          <h2 className="text-2xl font-semibold text-stone-900">{t.nextTitle}</h2>
          <p className="mt-3 text-stone-700">{t.next}</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <h2 className="text-lg font-semibold text-stone-900">{t.thanksTitle}</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-600">
            {t.thanks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
          </div>
        )}
      </section>
      <section className="mx-auto max-w-3xl space-y-8 px-4 pb-12">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/demo/" className="rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800">
            {t.demo}
          </Link>
          <Link
            href="/subscribe/"
            className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 hover:bg-stone-50"
          >
            {t.plans}
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <ContactBox />
      </div>
    </main>
  );
}
