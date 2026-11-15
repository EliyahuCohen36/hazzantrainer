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
- Pauses at a mafsik are reminders only, not part of the score
  (`SCORING.weights.pauses = 0` in src/lib/audio/scoring-config.ts).
- Everything must stay free to run (GitHub Pages; never anything paid).

## Where things are
- Te'amim names and the 24 books of Tanakh: src/data/teamim-reference.ts
- Trainer's ta'am names and pause lengths: src/lib/hebrew/teamim.ts
- Torah examples for each ta'am (from the Westminster Leningrad Codex): src/data/torah-examples.ts
- Recordings of each ta'am: files in public/audio/teamim/torah/, listed in src/data/teamim-recordings.ts
- Practice lessons (pesukim, master recordings, word timings): src/data/sample-curriculum.ts
- Scoring (melody, note placement, clarity, pauses): src/lib/audio/
- Pages: / (home, Tanakh section), /tanakh/[torah|neviim|ketuvim]/, /teamim/, /practice/[lessonId]/

## Adding a pasuk
Put the Hazzan's recording in public/audio/torah/<book>/, add the lesson to
sample-curriculum.ts with word timings and the stressed-syllable timings
(stressStart/stressEnd) measured from the recording.

Before pushing: `npx tsc --noEmit` and `npm run build` must pass.
