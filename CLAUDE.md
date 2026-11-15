# Kriah Trainer (hazzantrainer)

Torah reading trainer in the Syrian (Aleppo) tradition, live at
**https://eliyahucohen36.github.io/hazzantrainer/** (GitHub Pages, free).
GitHub Actions builds and publishes the site on every push to `main`
(.github/workflows/pages.yml, built with NEXT_PUBLIC_BASE_PATH=/hazzantrainer).
There's no need to upload folders by hand. Raw URLs to files in public/
(audio, icons) must go through `asset()` from src/lib/base-path.ts.

Older copies on Netlify (hazzantrainer.netlify.app, majestic-mandazi-9abc7e)
no longer update: that account's free build credits ran out. netlify.toml is
kept in case the owner goes back to Netlify.

## The owner's preferences
- Always spell it **Hazzan** (never "Chazzan"); this is the Syrian spelling.
- Te'amim names follow the Syrian tradition as given by the Sephardic
  Pizmonim Project (pizmonim.org/taamim.php), e.g. Kadma = Ashkenazi Pashta,
  Azla = Ashkenazi Kadma, Talsha (תלשׁא, ֠) = Telisha Gedola,
  Tilsa (תילשׂא, ֩) = Telisha Ketana. Talsha and Tilsa are two separate
  te'amim with different sounds: never merge them.
- Shofar Holekh + pesik (׀): the word with the Shofar Holekh is sung with the
  Pesik sound, on the letter that has the Shofar Holekh under it (card
  "Shofar Holekh with Pesik", id shofar-holekh-pesik; that letter is
  highlighted in the text view).
  Students must be told this; it's shown on both cards and in the text view.
- Ma'amid (meteg/silluq, U+05BD): drawn as a clear line under its letter
  (WithMaamid in src/components/reader/Maamid.tsx + .maamid in globals.css) in the
  Torah text, te'amim examples and pasuk practice, so readers see which letter
  takes the sound (e.g. Sof Pasuk). Shown whenever nikkud or te'amim are on.
- Qamats katan (U+05C7, marked in our text) and sheva na are drawn extra big and
  bold; sheva nach stays normal. Rules in src/lib/hebrew/vowel-hints.ts, drawn by
  WithMaamid (Maamid.tsx) + .vowel-* in globals.css.
- Recordings play only the Hazzan's voice (no synthetic melody, no file picker).
  One speed for all recordings (0.25–3×, presets 0.5/0.75/1/1.25/1.5/2, pitch kept):
  src/lib/audio/speed.ts + SpeedControl.tsx, remembered per browser.
- Torah Scroll Mode uses Stam Sefarad CLM (Sephardic Sefer Torah letters with
  tagin/crowns; src/fonts/stam-sefarad/, GPL + font exception, loaded with
  next/font/local in layout.tsx as --font-stam).
- Torah Scroll Mode on parasha pages shows the parasha as whole Sefer Torah
  columns (standard 245 columns × 42 lines, line for line), with an optional
  vowelled column beside it like a tikkun: src/components/tanakh/ScrollPages.tsx,
  src/lib/torah/scroll-pages.ts, data src/data/scroll-layout.json (line breaks
  from tikkun.io, MIT, mapped onto our text by scripts/scroll-layout/).
- Don't list Yareah ben Yomo among the te'amim (the owner removed it).
- Pauses at a mafsik are reminders only, not part of the score
  (`SCORING.weights.pauses = 0` in src/lib/audio/scoring-config.ts).
- Everything must stay free to run (GitHub Pages + Supabase free plan; never anything paid).
  The site itself is pay-to-use for schools (owner's decision, Nov 2026).

## Accounts and paying schools (Supabase, free plan)
- The site is pay-to-use: every page needs a signed-in account whose school
  licence is current, except / (welcome page for visitors), /demo/ (3 te'amim:
  src/data/demo.ts), /login/ and /join/. Gate: src/components/auth/AuthGate.tsx.
- Supabase project "kriah-trainer" (https://mjjdyfnfadjvdabmgzxf.supabase.co);
  URL + publishable key are in .github/workflows/pages.yml (public by design).
  Tables, codes and security rules: supabase/schema.sql (run in the SQL editor;
  safe to re-run). "Confirm email" is switched off (students have no email).
- Roles: admin (the owner, abccohen@gmail.com account) adds schools with seats
  and a paid-until date at /admin/; each school has a teacher code. Teachers make
  classes at /teacher/ (each has a class code) and see students' progress.
  Students sign up with a username (stored as <username>@students.kriah.invalid),
  password and class code. Progress is saved to the account (progress table).
- Recordings other than the 3 demo ones are in the private "recordings" bucket
  and played through signed links (src/lib/recordings.ts). Never commit them to
  public/ (the repo is public). New recordings: upload from /admin/ → Recordings.
- Te'amim levels: the trainer goes in 8 levels, easiest first (Level 1 = Ma'arikh
  Tarha + Sof Pasuk), defined in src/data/teamim-levels.ts. Children only see the
  levels their teacher opened (classes.unlocked_level, per-child override in
  class_members.unlocked_level; my_level() in supabase/levels.sql). Teachers set
  them in /teacher/. The quiz uses only open te'amim. Teachers/admins see all.
- Payment: schools by invoice (owner sets seats/paid-until by hand). Card
  checkout for families (Stripe) is planned, not built.

## Where things are
- Te'amim names and the 24 books of Tanakh: src/data/teamim-reference.ts
- Trainer's ta'am names and pause lengths: src/lib/hebrew/teamim.ts
- Torah examples for each ta'am (from the Westminster Leningrad Codex): src/data/torah-examples.ts
- Recordings of each ta'am: files in public/audio/teamim/torah/, listed in src/data/teamim-recordings.ts.
  (Only the 3 demo files stay in public/; the rest are in Supabase, see above.)
  Mafsikim get a solo recording. Mesharetim (e.g. Shofar Holekh) are recorded
  together with the ta'am they lead into, one pairing per file
  (e.g. shofar-holekh_segolta.mp3), in TORAH_TEAMIM_PAIRS with a Torah example;
  the pair shows on both cards ("Before X" / "After Y"). Process uploads with
  ffmpeg: trim silence, loudnorm I=-18, MP3 128k mono.
- Practising te'amim (for children): every recording on the te'amim trainer has a
  "Practice" button (src/components/tanakh/TaamPractice.tsx): the child sings, it's
  scored against the Hazzan's recording by scoreTaamPractice() in
  src/lib/audio/taam-practice.ts (melody match + tempo-free tune shape + length
  check), with stars and tips. Listening quiz: /tanakh/torah/teamim/quiz/
  (TeamimQuiz.tsx, uses solo recordings, offers look-alike te'amim as wrong
  answers). Progress (best scores, quiz record) is kept in the browser
  (localStorage), so it's per device.
- The 54 parashiyot with their 7 aliyot + Maftir (from @hebcal/leyning) and the
  Sephardic haftarah: src/data/parashot.ts. Book pages list them:
  /tanakh/torah/<book>/ (e.g. /tanakh/torah/bereshit/#noah)
- Full Torah text: src/data/torah/<book>.json (format in src/data/torah/index.ts), from
  Miqra According to the Masorah (CC BY-SA 4.0, attribute "Hebrew Wikisource"), with
  the Sephardic scroll spelling in the 10 places MAM notes a difference. Regenerate
  only from MAM-simple (github.com/bdenckla/MAM-basics). Parasha pages show it:
  /tanakh/torah/<book>/<parasha>/ (#aliyah-1 … #aliyah-7). Ta'am of each word:
  src/lib/hebrew/taam-of-word.ts.
- Aliyot are the common division (Hebcal). The owner wants the Edot HaMizrah
  division: still to do, once there's a reliable source (their chumash / Hazzan).
- Practice lessons (pesukim, master recordings, word timings): src/data/sample-curriculum.ts
- Scoring (melody, note placement, clarity, pauses): src/lib/audio/
- Pages: / (home, Tanakh section), /tanakh/[torah|neviim|ketuvim]/, /tanakh/torah/teamim/ (te'amim trainer: names, sounds, examples, Practice), /tanakh/torah/teamim/quiz/, /tanakh/torah/[book]/, /tanakh/torah/[book]/[parasha]/, /teamim/ (te'amim by book), /practice/[lessonId]/

## Layout the owner asked for
- Torah page: a short link card to the te'amim trainer first, then the five books
  straight away, each listing its parashiyot in order; every parasha links to its
  full text. Don't put long content above the books.

## Adding a pasuk
Put the Hazzan's recording in public/audio/torah/<book>/, add the lesson to
sample-curriculum.ts with word timings and the stressed-syllable timings
(stressStart/stressEnd) measured from the recording.

Before pushing: `npx tsc --noEmit` and `npm run build` must pass.
