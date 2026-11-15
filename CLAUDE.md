# Kriah Trainer (hazzantrainer)

Torah reading trainer in the Syrian (Aleppo) tradition, live at
https://hazzantrainer.netlify.app. Netlify builds the site from this
repository automatically on every push to `main` (`npm run build`, publishes
`out/`, see netlify.toml). There's no need to upload folders by hand.

## The owner's preferences
- Always spell it **Hazzan** (never "Chazzan"); this is the Syrian spelling.
- Te'amim names follow the Syrian tradition as given by the Sephardic
  Pizmonim Project (pizmonim.org/taamim.php), e.g. Kadma = Ashkenazi Pashta,
  Azla = Ashkenazi Kadma, Talsha = Telisha Gedola, Tirtsa = Telisha Ketana.
- Pauses at a mafsik are reminders only, not part of the score
  (`SCORING.weights.pauses = 0` in src/lib/audio/scoring-config.ts).
- Everything must stay free to run (Netlify free plan, netlify.app address).

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
