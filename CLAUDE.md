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
  bold; sheva nach stays normal. Sheva rules are the owner's (na after qamats,
  tsere, hiriq male, holam, mid-word shuruk, on the first letter, or with a dagesh;
  nach after patah, segol, hiriq haser, qamats katan, qubuts, or a word-initial וּ;
  nach right after the stressed vowel in mil'el words like לָ֑יְלָה, קֵ֣דְמָה, הַשָּׁמָ֑יְמָה,
  stress read from the te'amim; never bold in Hashem's name).
  Rules in src/lib/hebrew/vowel-hints.ts, drawn by
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
- Yetib (U+059A) is drawn BEFORE its word, at the far right (YetibFirst in
  Maamid.tsx, .yetib-before), never under/after a letter, so it isn't confused with
  Shofar Mehuppakh. Te'amim levels: a locked level shows only its number (no title/contents).
- Text size (zoom) on all Tanakh text pages, both modes, remembered per browser:
  src/components/reader/Zoom.tsx (wider than the page when zoomed; scroll columns grow).
- Inquiries: eliyahucohen36@gmail.com (CONTACT_EMAIL in src/data/demo.ts, ContactBox on
  welcome, about, subscribe).
- Everything must stay free to run (GitHub Pages + Supabase free plan; never anything paid).
  The site itself is pay-to-use for schools (owner's decision, Nov 2026).

## Accounts and paying schools (Supabase, free plan)
- The site is pay-to-use: every page needs a signed-in account whose school
  licence is current, except / (welcome page for visitors), /demo/ (3 te'amim:
  src/data/demo.ts), /login/, /join/, /about/ and /subscribe/. Gate: src/components/auth/AuthGate.tsx.
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
- Te'amim levels: 29 levels (src/data/teamim-levels.ts, owner's design Nov 2026): Level 1
  Mil'el and Milra (MilelMilra.tsx, ~36 words with a ma'amid, src/data/stress-words.ts, quiz key
  teamim-stress, pass 80%); then ONE ta'am per level (mafsik before the mesharet that leads into
  it); "combo" levels for pairs after both are learned (5 Ma'arikh Tarha / Tarha Ma'arikh,
  13 Shofar Mehuppakh Kadma; COMBO_RECORDINGS, LEVEL_LESSONS incl. the Kadma end-of-word = mafsik /
  mid-word = connecting note at level 11). "All the te'amim" list + one review recording per tune
  (teamim/<tune>/all.mp3) at the top of the trainer and on /teamim/ (AllTeamim.tsx). Children only see the
  levels their teacher opened (classes.unlocked_level, per-child override in
  class_members.unlocked_level; my_level() in supabase/levels.sql). Teachers set
  them in /teacher/. The quiz uses only open te'amim. Teachers/admins see all.
- Payment: schools by invoice (owner sets seats/paid-until by hand).
  Individuals: $12/month or $100/year (src/data/pricing.ts: STRIPE_PAYMENT_LINK monthly,
  STRIPE_YEARLY_LINK yearly; the webhook gives 12 months when amount_total ≥ $50). /subscribe/ creates an account
  (email, no code) and opens the Stripe Payment Link with client_reference_id =
  user id. The webhook supabase/functions/stripe-webhook sets role 'family' and
  paid_until (supabase/payments.sql adds profiles.stripe_customer_id). Until
  STRIPE_PAYMENT_LINK is set, /subscribe/ says payments open soon.
  Stripe account "Keriah Trainer" (live): product "Kriah Trainer – Individual"
  with prices $12/month and $100/year (Nov 17, 2026; the old $10 link is deactivated, the $10 price
  kept for anyone already on it), Managed Payments on (owner's choice), payment link redirects to
  /subscribe/?paid=1; customer portal on (cancel at period end); webhook
  destination "Kriah Trainer access" → functions/v1/stripe-webhook (JWT check off),
  events checkout.session.completed + invoice.paid. Only secret needed:
  STRIPE_WEBHOOK_SECRET (entered by the owner); no Stripe API key. First payment
  gives a month + 3 days; each invoice.paid sets the exact paid-until date.
- Site header on every page (Home, About, demo, account): SiteHeader in AuthGate.tsx.
  Visitors' home page: src/components/auth/Landing.tsx (pictures in public/images/,
  screenshots of the trainer). About page: src/app/about/page.tsx (open to all).

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
- Nevi'im and Ketuvim full texts: src/data/tanakh/<book>.json (same format, `s` = part of a
  combined book: Shemuel/Melakhim/Tere Asar/Ezra-Nehemia/Divre HaYamim), built by
  scripts/tanakh-text/build.py from MAM-simple. Chapter list (browser-safe):
  src/data/tanakh-chapters.ts. Pages: /tanakh/<neviim|ketuvim>/<book>/ (chapters) and
  /tanakh/<section>/<book>/<chapter>/ (ChapterView.tsx; chapter slug "3" or "alef-3",
  "yonah-2"). No Scroll Mode in Nevi'im; in Ketuvim only the 5 megillot (MEGILLOT,
  "Megillah Scroll Mode"). Tehillim, Mishle, Iyov 3:2–42:6 are Ta'amei Emet (verse e: 1):
  ta'am names by emetTeamim() in taam-of-word.ts (EMET_TEAMIM ids emet-*).
- Tanakh recordings (admin uploads at /admin/ → Tanakh recordings, TanakhRecordingsPanel):
  readings reading/<book>/<parasha>/aliyah-<n>.mp3 + maftir.mp3, reading/<book>/<chapter>.mp3;
  te'amim of each tune teamim/<tune>/<taamId>.mp3 (TUNE_SETS in src/data/tanakh-recordings.ts:
  torah, neviim, tehillim, mishle, iyov, shir-hashirim, ruth (+Kohelet, Daniel, Ezra-Neh,
  Divre HaYamim), eikha, ester). Pages find them by listing the bucket folder
  (useExistingRecordings in src/lib/recordings.ts), so no code change per upload. A reading
  shows on its aliyah/chapter with "Read … yourself": TaamPractice long mode (manual stop,
  6 s quiet, scored on shrinkAnalysis() coarse contours). Tune te'amim play on /teamim/.
- Language: flags top right (US English, Israel Hebrew, Syria Arabic), LanguageProvider in
  src/lib/i18n/Translator.tsx swaps page text for src/lib/i18n/dict.ts translations
  (exact text; {n} numbers, {*} any words) and names to Hebrew (names.ts); <html dir=rtl>
  for he/ar. To translate more, add lines to dict.ts. Elements with lang="he" or
  data-no-translate are left alone.
- Nusach picker in the header (src/data/nusachim.ts): Syrian, Yerushalmi (all the Syrian content;
  a recording uploaded under nusach/yerushalmi/<same path> replaces the Syrian one when Yerushalmi
  is picked: recordingUrl() in src/lib/recordings.ts; the admin uploads them by picking Yerushalmi
  and dropping files as usual), Ashkenaz "coming soon".
- "Please do not use this app on Shabbat and Yamim Tovim." is under the header on every page.
- Admin drag-and-drop: AdminDrop (src/components/admin/AdminDrop.tsx) sits beside every slot for
  the admin only: aliyot/maftir/haftarah/chapter readings, te'amim cards, combos, review recording,
  beginner tiles, every Siddur paragraph (and each maqam tune). recordingsChanged() refreshes pages.
- Parasha pages (TorahText nav): All / Kohen…Shevi'i / Maftir / Haftarah, or Weekday aliyot
  (Monday, Thursday, Shabbat Minha: Kohen, Levi, Yisrael) from src/data/parasha-extra.ts
  (@hebcal/leyning; haftarah "syrian" = Sephardic, "ashkenaz" kept for later). In Torah Scroll Mode
  the aliyah name sits above the exact first word of its pasuk; picking an aliyah shows only its
  columns and fades every other word. Zoom in scroll mode scales the page as it is (CSS zoom).
  Haftarah text from the Nevi'im data (versesRange), recording reading/<book>/<parasha>/haftarah.mp3.
- Bold qamats katan / sheva na are a little smaller and move to the right side of the letter when
  a ta'am or ma'amid is under the same letter (.vowel-shift).
- Torah page: two tabs (TorahTabs.tsx): Tikkun (everything above) and Shnayim Mikra ve-Ehad Targum
  (/tanakh/torah/shnayim-mikra/ with why + short halakhot, and /<parasha>/: each pasuk twice then
  Onkelos; Targum Onkelos, Yemenite Taj vocalization, Hebrew Wikisource CC BY-SA, in
  src/data/onkelos/, built by scripts/onkelos/build.py). Five book buttons above the parashiyot.
- Siddur (/siddur/, /siddur/<part>/): nusach Edot HaMizrah, Torat Emet 357 via Sefaria
  (scripts/siddur/build.py → src/data/siddur/). Recording per paragraph:
  siddur/<part>/<section>-<paragraph>.mp3 (1-based), tunes <…>@<maqam>.mp3 for the owner's tune
  places (TUNE_SPOTS, MAQAMOT in src/data/siddur/index.ts). Word highlighting: the admin presses
  "Time the words" and taps each word while it plays; times saved as the same name .json.
  Long recordings covering many paragraphs (LongRecordings.tsx): siddur/<part>/long-<n>.mp3 (n 1–9),
  dropped in the admin box at the top of a part; the admin marks where each paragraph starts
  (estimate from letter counts, "Jump near it", "Not in the recording"); marks saved in
  long-<n>.json {marks:[{s,p,t}]} (0-based); each marked paragraph plays its own stretch
  (SegmentPlayer). A paragraph's own recording wins. Owner's Birkot HaShahar (Mode Ani → Birkot
  HaTorah, part "morning") and Korbanot (Vatitpalel Hana → "בלבב שלם", shaharit 4:1–6:30) were
  sent as MP3s to his Downloads/torah-trainer/siddur/ (Supabase free plan: files ≤ 50 MB).
- Aliyot are the common division (Hebcal). The owner wants the Edot HaMizrah
  division: still to do, once there's a reliable source (their chumash / Hazzan).
- Practice lessons (pesukim, master recordings, word timings): src/data/sample-curriculum.ts
- Scoring (melody, note placement, clarity, pauses): src/lib/audio/
- Pages: / (home, Tanakh section), /tanakh/[torah|neviim|ketuvim]/, /tanakh/torah/teamim/ (te'amim trainer: names, sounds, examples, Practice), /tanakh/torah/teamim/quiz/, /tanakh/torah/[book]/, /tanakh/torah/[book]/[parasha]/, /teamim/ (te'amim by book), /practice/[lessonId]/, /beginner/ (Beginner Keriah)

## Beginner Keriah (kindergarten / first-time readers)
- /beginner/ (card on the home page): /beginner/letters/ (22 letters with the
  dagesh/dot pairs Bet/Vet, Kaf/Khaf, Pe/Fe, Shin/Sin as their own tiles, plus the
  5 sofiyot beside their letters), /beginner/nekudot/ and /beginner/nekudot/<id>/
  (every letter with that nekuda), /beginner/chart/ (all letters × all nekudot).
- Data: src/data/beginner.ts (Syrian/Sephardic pronunciation: qamats = "a",
  tav = "t"). Sofiyot take no nekuda except Khaf Sofit with qamats (ךָ) (and ךְ, once sheva is taught).
  Throat letters (א ה ח ע) take hataf instead of sheva; hataf only on them.
- The Sheva is NOT in the letters/nekudot pages or chart (owner): it has its own
  section /beginner/sheva/ (Sheva Na vs Nach rules, examples drawn with WithMaamid,
  every letter with a sheva, ךְ), opened only after everything else (level 12).
  Hataf nekudot stay with the other nekudot.
- Levels (BEGINNER_LEVELS in beginner.ts): 1–3 letters, 4 sofiyot, 5–10 nekudot by
  sound, 11 full chart, 12+ the Sheva and Qamats Katan steps, one per level (SHEVA_STAGES in
  src/data/sheva-stages.ts, owner's order: Nach after patah, segol, hiriq haser, qamats katan,
  qibbus, then all; Na after qamats, tsere, hiriq male, holam, mid-word shuruq, then all; na or
  nach; nach after initial וּ; end of word; na at the start; two in the middle; all; then Qamats
  Katan: rule, same letters both ways (שָֽׁמְרָה/שָׁמְרָה, אָכְלָה, לָמְדָה), gadol or katan, before a
  maqaf). /beginner/sheva/practice/ (ShevaTrainer.tsx): 50 words a step, pass 40, the child picks
  the right reading of the highlighted sheva/qamats (Latin syllables), words from the Torah in
  src/data/sheva-words.json (scripts/sheva-words/build.py; a qamats gadol before a sheva gets a
  ma'amid; in the qamats steps the katan is shown as a plain qamats). Teachers open them per class (classes.beginner_level) and per
  child (class_members.beginner_level); my_beginner_level() in supabase/beginner.sql.
  Locks: src/components/beginner/Lock.tsx (BeginnerLock, LockTile, BeginnerLevelPath).
- Recordings (his voice only) go in BEGINNER_RECORDINGS (src/data/beginner-recordings.ts):
  letter:<id>, sound:<letterId>:<nekudaId>, nekuda:<id>. Tiles without one show no 🔊.
  Same-sounding nekudot share a recording (patah→qamats, segol→sere, hireq-male→hireq,
  holem-male→holem, shuruq→qibbus, hataf-*→qamats/sere/holem), so he records one file
  per letter: "Bet – b – ba – be – bi – bo – bu" (~28 files; sheva sounds b' are
  recorded later for the Sheva section, key sound:<id>:sheva → <id>-sheva.mp3), cut at the pauses
  (name, sound alone, then the nekuda sounds; Alef and He have no sound alone).
  The plain letter's tile plays the name, then the sound alone (owner's choice).
  Cut files are named letter-<id>.mp3, <id>-alone.mp3, <id>-<qamats|sere|hireq|holem|qibbus>.mp3,
  nekuda-<id>.mp3, go to the bucket under beginner/, and are listed in BEGINNER_RECORDED.
  The admin uploads them in one go with "Upload several files" (/admin/ → Recordings).
  Cut a letter recording with: python3 scripts/beginner-recordings/cut.py <file> <letterId> <outdir>,
  then add the names to BEGINNER_RECORDED and put the clips in his Downloads/torah-trainer/beginner-recordings/.
  Alef and He have no sound by themselves: the letters page says so (owner's request).
  vet-alone.mp3 is stretched to ~1.9 s (owner wanted a longer "v"): rubberband tempo=0.6.
  Final letters use their regular letter's recordings (fileFor strips -sofit; owner's choice).
  To check a cut, vowel formants tell a/e/i/o/u apart (F1 high = a, F2 high = i, F1 low + F2 low = u).
- Letter trainer: /beginner/letters/practice/ (LetterTrainer.tsx), 5 questions per open letter
  (130 for the whole alef-bet; owner's request), mixed so no letter twice in a row and no kind
  three times in a row, and no letter asked the same way twice within 10 questions; a round in progress is saved in the browser (Stop for now / Carry on): hear a letter's sound → tap the letter(s) (multi-select when letters share a
  sound, by sym: Samekh/Sin, Vet/Vav; Tet ط and Tav ت are DIFFERENT sounds, owner), see a letter → pick its sound of 3, hear a
  name → tap the letter (Alef/He only by name). Teachers open letters ONE AT A TIME from Alef
  (classes.letters_open / class_members.letters_open, my_letters_open() in supabase/letters.sql;
  "Letters open" select in /teacher/); the alef-bet page locks the rest (LetterLock). Level 4+
  opens all letters. Scores: recordPractice beginner-letters:<n>, recordQuiz beginner-letter:<id>
  (teacher sees "Letters to practise").
- Nekudot practice: /beginner/nekudot/practice/<a|e|i|o|u|hataf|all>/ (NekudaTrainer.tsx, groups in
  src/data/nekuda-groups.ts), single sounds only (owner: not words): a letter with the nekuda (בָּ)
  or letter + nekuda + a final letter (אָב), from open letters and nekudot learned so far; 5 per open
  letter (130 max). Hear → tap the written form(s) (multi-select when they sound the same: בָּ/בַּ,
  סָ/שָׂ); read → pick the sound of 3. Stop for now / Carry on. Linked from each nekuda page and the
  nekudot page; locked to the group's beginner level. recordPractice beginner-nekudot:<group>,
  recordQuiz beginner-nekuda:<id> (teacher sees "Nekudot to practise").
- Practice words: /beginner/words/ (WordPractice.tsx), real Torah words with no sheva, from
  src/data/beginner-words.json (each word: syllables + the sounds it uses, "a","e","ae"…; built by
  scripts/beginner-words/build.py: no sheva/qamats qatan/furtive patah/mappiq/names of Hashem;
  a yod after sere/segol is silent, also at the end: אֲחֵי = a-he). In STAGES (WORD_STAGES in
  src/data/beginner-words.ts), owner's design: a only → e only → a+e together → i only →
  i with a,e → o → o mixed → u → u mixed → hataf → all. Each stage is 50 questions; pass
  = 40/50; the next stage stays locked until the one before is passed (teachers/admins
  see all), and a stage also needs its nekudot level opened by the teacher. A stage in
  progress is saved in the browser (stop and carry on). Question kinds (WordQuestion.tsx):
  listen (hear him, pick the written word of 3), sound (see the word, pick which of 3
  sounds says it), say (say it into the mic; checked ON THE DEVICE by src/lib/audio/word-check.ts:
  records until the child stops, MFCC + DTW against his joined word, the same letters with one
  vowel changed (6) and 2 other words, at 4 voice-size warps; right if closest and distance
  ≤ 2.45, or within 5% and distance ≤ 2.25; non-voices (flat noise, hum) rejected by spectral
  flatness. One mic stream per session (releaseMic on unmount); teachers/admins see a small
  "Check (teachers only)" line with the numbers. Browser speech recognition was tried first and heard nothing on the owner's iPhone,
  so it's not used. Simulated child voice: 90% right accepted, 7% wrong vowel accepted.
  Two tries; "didn't hear you" doesn't count; owner wants no grown-up grading, so ✓/✗ only
  where there's no microphone. The Claude app's built-in browser blocks the mic: test on a phone). Modes: Mixed practice (all three in turn; default, owner's
  request; kinds in a random mix, no more than two of a kind in a row), Listen and pick,
  Read aloud. After every listen/sound answer the child also SAYS the word ("Now you say it",
  SayIt in WordQuestion.tsx). Every spoken word is tracked (owner's request) with recordQuiz:
  beginner-say:<stage> (right/total per step) and beginner-word:<word>; the teacher page shows
  "Said aloud" % and "Words to practise". Up to 250 words per sound mix (u-only has just 34 in
  the Torah); a step's 50 questions never repeat a word unless the step has fewer than 50.
  Listen/sound need the word's syllables recorded. Score saved with
  recordPractice key beginner-stage:<id>; teachers see it.
  Words are played as ONE smooth word (owner's request): src/lib/audio/join-syllables.ts
  decodes the syllable clips, trims silence, keeps each syllable whole (only very long
  ones trimmed: middle 0.65 s, last 0.8 s, alone 0.6 s; owner found 0.32 s far too fast),
  cross-fades 30 ms, and plays the WAV
  with the speed control.
- Demo (/demo/): BeginnerDemo.tsx, 6 mixed questions on 8 "a" words (src/data/beginner-demo.json);
  only their letters' clips (all five vowels, for the say-it check) are public (public/audio/beginner/, in DEMO_FILES).
- Tap-to-hear sounds (tiles, practice words) play through ONE shared player
  (src/lib/audio/player.ts; never hangs: falls back to the Web Audio engine if the player
  doesn't start in 4 s; the engine is unlocked with a silent sample on every tap) unlocked during a tap: Safari on the Mac blocked players started
  after an await; if the player is refused it falls back to the Web Audio engine.
  /beginner/check/ (SoundCheck.tsx): one-tap device check (audio engine, player, engine
  playback, private recordings, mic permission, recording) shown as ✅/❌ and saved to the
  diagnostics table (supabase/diagnostics.sql; admin-only read) so problems on a student's
  device can be read from the admin account. Linked from the practice words page.
- Local preview without Supabase settings opens every level (auth.tsx).

## Layout the owner asked for
- Torah page: a short link card to the te'amim trainer first, then the five books
  straight away, each listing its parashiyot in order; every parasha links to its
  full text. Don't put long content above the books.

## Adding a pasuk
Put the Hazzan's recording in public/audio/torah/<book>/, add the lesson to
sample-curriculum.ts with word timings and the stressed-syllable timings
(stressStart/stressEnd) measured from the recording.

Before pushing: `npx tsc --noEmit` and `npm run build` must pass.
