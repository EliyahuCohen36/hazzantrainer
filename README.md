# Kriah Trainer: Phase 1 Prototype

Student practice screen for Torah reading with te'amim in the Syrian tradition.
Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Web Audio API · Pitchfinder (YIN).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 → click "Bereishit 1:1"
```

The microphone needs a secure page. `localhost` counts. To test on a phone or
tablet on your network, run `npm run dev:https` and open the https:// address.

**Master recording:** Bereishit 1:1 is at `public/audio/torah/bereishit/1-1.wav`, with
word and stressed-syllable timings in `src/data/sample-curriculum.ts`. You can also drop
any audio file onto the Master Recording card (melody scoring only, since it has no timings).

## How to use the screen

1. **Reading pane.** Torah Scroll Mode hides all marks and switches to a scroll-style
   face. With it off, Nikkud / Te'amim / Ta'am names toggle on their own.
   Clicking a word plays the master from that word (needs word timings).
2. **Master recording.** Play/seek, speed 0.75× or 1× (pitch is preserved when slowed).
3. **Voice trainer.** Press the mic, chant, press stop. With "Play master while I chant"
   on, the master plays along and recording stops when it ends (use headphones,
   or the mic picks up the master). You get:
   - a live pitch trace over the master melody, plus a live accuracy estimate
   - a final score (0–100), average deviation in cents, how much of the pasuk was covered,
     words coloured by score, and playback of your own recording.

## The score

After each attempt the student gets one score out of 100, built from three parts
(weights in `src/lib/audio/scoring-config.ts`):

| Part | Weight | What it checks |
|---|---|---|
| Melody | 40% | The right notes for each ta'am (pitch shape; see below) |
| Note on the right syllable | 30% | Each ta'am's melody is sung on its stressed syllable, the letter carrying the mark |
| Clarity | 30% | Full singing voice, steady notes, loud enough above the room noise, distinct syllables (not mumbled) |

**Pauses are reminders, not scored.** If the student doesn't pause after a mafsik (Tarha,
Atnah…) or stops after a mesharet (Ma'arikh, Shofar Holekh…), the card says so
("Remember to pause after בראשית") without changing the score. To count pauses, give
`pauses` a weight in `scoring-config.ts`.

The score card shows each part, a word-by-word table (melody, placement, pause) and up to
five plain-language tips. Words in the reading pane are coloured by their combined score.

**Pause lengths** per ta'am are `pauseMs` in `src/lib/hebrew/teamim.ts` (Atnah 0.25 s,
Tarha 0.15 s, …). A pause is near-silence, 18 dB below the reader's normal loudness.

**How placement works** (`reading-score.ts`): the student is aligned to the master twice.
Once by *sound of the words* (MFCC speech features, which ignore pitch) and once by *melody*.
If the melody is on the right syllable the two alignments agree; if it's a syllable early
or late they disagree inside that word, and that word loses its placement points.
This needs `stressStart`/`stressEnd` (the stressed syllable) in the recording's timings.

Checked against altered copies of the master recording:

| Test recording | Overall | Melody | Placement | Clarity | Pause reminders |
|---|---|---|---|---|---|
| Master itself | 100 | 100 | 100 | 100 | after both Tarhas |
| Master + 0.2 s pause after each Tarha | 100 | 99 | 100 | 100 | none |
| Other voice (+7 semitones, child-like formants, 15% slower) | 100 | 99 | 100 | 100 | after both Tarhas |
| Atnah pause removed | 100 | 100 | 100 | 100 | Atnah + both Tarhas |
| Tarha melody sung on בְּרֵא instead of שִׁית | 95 | 97 | 86 (word: 0) | 100 | after both Tarhas |
| Mumbled (muffled, syllables run together) | 91 | 99 | 100 | 70 | some |
| Very quiet and noisy | 44 | 51 | 57 | 23 | all |

## How the pitch matching works (`src/lib/audio/`)

| Step | File | What it does |
|---|---|---|
| Detect | `pitch-detector.ts` | YIN on each audio frame; silence gate; 60–1100 Hz range |
| Contour | `contour.ts` | Hz → semitones, fixes detector octave slips, median-smooths, then **subtracts the singer's own median pitch**, leaving a relative melody curve |
| Compare | `compare.ts` | **DTW** (time-warping, banded) aligns student to master; every distance is **octave-folded**; scored in both directions so both missing notes and extra wrong notes count |
| Live | `VoiceTrainer.tsx` | Estimates the student's transposition `T = median(student − master)` while they chant, then scores each frame against the master at the same moment |

So a child an octave (or any interval) above the Hazzan, singing slower or faster,
is judged only on the shape of the melody.

Sanity checks on synthetic voices:

| Attempt | Score |
|---|---|
| Correct melody, octave up, 30% slower | 99 |
| Correct melody, other key | 100 |
| Correct melody with vibrato and drift | 99 |
| One wrong note out of 15 | 92 |
| Monotone (one pitch throughout) | 49 |
| Wrong melody | 29 |

Strictness lives in `pointScore()` in `pitch-math.ts`. Full credit is within ½ semitone;
zero is at a whole step off.

## Project structure

```
src/
├── app/
│   ├── layout.tsx                 # fonts, metadata, PWA viewport
│   ├── globals.css                # Tailwind + Hebrew font stacks
│   ├── manifest.ts                # PWA manifest
│   ├── page.tsx                   # catalog: Subject → Course → Unit → Lesson
│   └── practice/[lessonId]/page.tsx
├── types/curriculum.ts            # the scale-ready data model
├── data/sample-curriculum.ts      # Bereishit 1:1 + empty Haftarah/Tefillah/Mishnah
├── lib/
│   ├── curriculum/repository.ts   # data-access interface (swap for a DB in Phase 2)
│   ├── hebrew/marks.ts            # show/hide nikkud & te'amim from one source string
│   ├── hebrew/teamim.ts           # ta'am catalog with Syrian names
│   ├── hebrew/syllables.ts        # syllable count + stressed letter from nikkud/te'amim
│   └── audio/                     # pitch-math, pitch-detector, contour, compare, test-tone,
│                                  # features (pitch/loudness/MFCC), reading-score, scoring-config
├── hooks/
│   ├── useMasterTrack.ts          # load + analyse master (file / upload / test tone)
│   └── usePitchRecorder.ts        # mic → AnalyserNode → YIN, plus MediaRecorder
└── components/
    ├── practice/PracticeScreen.tsx
    ├── reader/HebrewReader.tsx, DisplayModeToggle.tsx
    ├── audio/MasterAudioPlayer.tsx
    └── trainer/VoiceTrainer.tsx, PitchCanvas.tsx, AccuracyMeter.tsx, ScoreCard.tsx
```

## Data model

`Subject → Course → Unit → Lesson`, normalized with parent ids (they map directly
onto tables). A lesson holds `segments` (words, each with fully-pointed text and a
`taam`) and `recordings`. **Word timings belong to the recording, not the text**,
because different Hazzanim chant at different speeds. A Haftarah, a prayer or a
Mishnah is just another lesson with different segments. Add new content in
`sample-curriculum.ts`.

## Fonts

- **Noto Serif Hebrew** (learning mode): has glyphs for all 31 te'amim and all
  nikkud, with mark positioning, so marks don't collide.
- **Frank Ruhl Libre** (scroll mode): has *no* te'amim glyphs, so it's only used
  when marks are hidden.
- Both are self-hosted via Fontsource, so they work offline.
- To use SBL Hebrew or Taamey Frank CLM, self-host the font and list it first in
  `--font-hebrew` in `globals.css`. Check the licence for commercial use.

## Notes and known limits

- **Syrian ta'am names** in `lib/hebrew/teamim.ts` should be checked with your Hazzan.
  It's the only place they're defined.
- Placement, pause and clarity scores are tuned on the master recording and altered copies
  of it. Re-check the thresholds in `scoring-config.ts` once real students have tried it.
- The full score analyses the student's recording after they press stop. If a browser
  can't decode its own recording, the trainer falls back to the melody score only.
- The **live** meter assumes the student keeps time with the master. The **final** score
  doesn't (it uses DTW).
- Live detection runs once per animation frame. Phase 2 could move it into an
  AudioWorklet for steadier frames and background-tab support.
- U+05BD is both meteg and silluk. It's grouped with te'amim, so it shows whenever
  te'amim are on.

## Suggested Phase 2

Service worker for offline lessons · attempt history and progress per student ·
school/synagogue tenants and teacher dashboards (implement `CurriculumRepository`
against Postgres) · word-timing editor for teachers · per-ta'am drills (all Tarha
words across the Torah).
