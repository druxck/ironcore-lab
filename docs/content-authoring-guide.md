# Authoring content for Ironcore Lab

Everything under `content/` is data — JSON plus Markdown — loaded and Zod-validated by `src/main/content/contentLoader.ts` and `contentSchema.ts`. Adding a new arc or lesson never requires touching app code. This guide is the spec for doing it correctly, using Assembly Basement (`content/arcs/assembly-basement/`) as the worked reference — read a couple of its lessons alongside this doc.

## Directory shape

```
content/arcs/<arc-id>/
  arc.json
  lessons/                              # only for status: "authored"
    <NN>-<slug>/
      lesson.json
      content.md
      exercises/
        <NN>-<slug>/
          exercise.json
          tests.json                    # [] if the exercise has no WSL-graded tests
  lessons-outline.json                  # only for status: "outline", instead of lessons/
```

Lesson and exercise directory names are just for human sorting — the loader sorts by each object's own `order` field, not by folder name. Keep them numbered anyway; it's how you keep your own place.

## IDs

- Arc id: kebab-case, matches its directory name, e.g. `patch-bay`.
- Lesson id: `<arc-id>-<NN>-<slug>`, e.g. `patch-bay-03-branching`.
- Exercise id: `<lesson-id>-exNN-<slug>`, e.g. `patch-bay-03-ex01-if-else`.

IDs are permanent references — save files store completed lesson/exercise IDs, and the error glossary and history cards reference lesson IDs. Don't rename one after the fact without writing a save migration.

## `arc.json`

```json
{
  "id": "patch-bay",
  "title": "The Patch Bay",
  "roomName": "Patch Bay",
  "shortDescription": "One sentence, shown on the Lab Map tile.",
  "longDescription": "A paragraph, shown when the room is opened.",
  "order": 2,
  "unlockRequires": [{ "arcId": "assembly-basement", "minRestorationPct": 80 }],
  "theme": { "accentColor": "#39ff88", "motif": "short-slug-description" },
  "status": "authored"
}
```

`unlockRequires` can be an empty array (nothing gates it). `theme.accentColor` should be a distinct hex color per arc — it's used for the room's glow and progress bar.

## `lesson.json`

```json
{
  "id": "patch-bay-03-branching",
  "arcId": "patch-bay",
  "order": 3,
  "title": "Branching the Signal",
  "objectives": ["Two to four short, concrete, checkable statements"],
  "prerequisites": [],
  "narrativeContentPath": "arcs/patch-bay/lessons/03-branching/content.md",
  "estXp": 50,
  "historyCardIds": ["hc-optional-id-if-genuinely-relevant"]
}
```

`prerequisites` is reserved for a future non-linear unlock graph — for now, leave it `[]` and rely on `order` for sequencing within the arc. `narrativeContentPath` is relative to `content/`. `estXp` is purely informational (shown on the Lab Map lesson list) — it doesn't have to exactly equal the sum of the lesson's exercise `baseXp` values, just be roughly right. Only attach `historyCardIds` when a card is genuinely relevant to that lesson's topic — don't force one in.

## `content.md`

Plain Markdown, rendered by a small first-party renderer (`src/renderer/components/Markdown.tsx`) that supports: `#`/`##`/`###` headings, paragraphs, fenced code blocks (` ``` `), unordered lists (`- item`), blockquotes (`> text`), and inline `**bold**` / `*italic*` / `` `code` ``. Nothing fancier — no tables, no nested lists, no HTML.

Tone: open with a short (2–4 sentence) in-character "logbook" flavor line if it fits naturally, then switch to clear, direct instructional prose. Flavor is a wrapper, never a substitute for clarity — a reader should be able to skip the italicized logbook line entirely and lose nothing technical. Keep real Unix/C history to the dedicated `HistoryCallout` cards (via `historyCardIds`), not invented dialogue from real people (Ritchie, Thompson, Kernighan) in the narrative body.

## `exercise.json`

```json
{
  "id": "patch-bay-03-ex01-if-else",
  "order": 1,
  "title": "Short, specific title",
  "type": "write-program",
  "prompt": "Exactly what the program must do, in plain language, including exact output format if relevant.",
  "starterCode": "#include <stdio.h>\n\nint main(void) {\n    // your code here\n    return 0;\n}\n",
  "expectedAnswer": "only for predict-output / fill-in-blank",
  "gdbCommands": "only for debug-with-gdb, a gdb -batch script, e.g. \"run\\nbt\\n\"",
  "gradingCriteria": ["stdout-match"],
  "baseXp": 30,
  "timeoutSeconds": 5,
  "memoryLimitMb": 64
}
```

`lessonId` and `tests` are intentionally **not** in this file — the loader injects `lessonId` from the parent lesson and merges in `tests.json` automatically.

### `type` and how each is graded

| `type` | Editor shown? | Graded by |
|---|---|---|
| `write-program` | Monaco, real C | WSL compile + run against `tests.json`, real gcc/clang |
| `fix-the-bug` | Monaco, pre-seeded with broken `starterCode` | same as `write-program` |
| `predict-output` | No — free-text answer box | client-side string compare against `expectedAnswer`, no WSL round trip |
| `fill-in-blank` | No — free-text answer box | same as `predict-output` |
| `debug-with-gdb` | No — runs `starterCode` under `gdb -batch -x <gdbCommands>` against a fixed buggy program, shows the transcript, then a free-text answer box graded against `expectedAnswer` | real WSL + gdb, plus a client-side answer check |

For `predict-output`/`fill-in-blank`, `starterCode` is still required by the schema — set it to `""` unless showing a code snippet as part of the question is useful, in which case put that snippet there (it renders read-only above the answer box).

### `gradingCriteria`

An **AND'd list of what's required to pass**, not a menu — every listed criterion must be met:

- `stdout-match` — every case in `tests.json` matches (almost always include this)
- `no-warnings` — zero compiler warnings (compiles are always `-Wall -Wextra`)
- `sanitizer-clean` — zero AddressSanitizer/UBSan findings (sanitizers are always compiled in except under `valgrind-clean` grading)
- `valgrind-clean` — a separate, more expensive Valgrind run comes back with zero leaks/errors; only request this where it's pedagogically the point (Memory Wing onward) — it triggers an extra WSL invocation on every submit

Meeting a criterion that **isn't** in this required list still earns small bonus XP (see `xpEngine.ts`) — so a `patch-bay` exercise that only requires `stdout-match` still rewards a student whose solution also happens to compile warning-free.

### XP, timeouts, limits

- `baseXp`: roughly 15 for a fill-in-blank/predict-output concept check, 30–40 for a normal exercise, 50+ for a lesson capstone.
- `timeoutSeconds` / `memoryLimitMb`: `5` / `64` is the sane default for everything in Assembly Basement through Memory Wing. Only raise them for an exercise that legitimately needs more (e.g. a capstone doing real allocation work).

## `tests.json`

```json
[
  {
    "id": "main",
    "stdin": "",
    "expectedStdout": "exact expected text, including trailing \\n\n",
    "matchMode": "exact",
    "hidden": false,
    "description": "One line shown to the student describing what this case checks"
  }
]
```

- `[]` is valid and expected for `predict-output`/`fill-in-blank` exercises.
- `matchMode: "exact"` is the default choice — it forces students to get newlines and spacing right, which is itself part of the lesson early on. Use `"trim"` or `"normalize-whitespace"` only where exact formatting genuinely isn't the point of the exercise (e.g. a numeric-answer program where trailing whitespace shouldn't matter).
- Add a `hidden: true` case or two on anything gradeable by a shortcut (e.g. hardcoding the one visible expected output) — hidden cases still run and still gate passing, but their expected/actual output isn't shown to the student, only pass/fail.
- The first non-hidden case's `stdin` is also what the **Run** button (as opposed to Submit) feeds the program, so make it a reasonable "try it out" input even before `matchMode` correctness matters.

## Error glossary and history cards

- `content/error-glossary/gcc-clang.json` (and `valgrind.json`, `sanitizers.json`) are substring-matched against real compiler/tool output — see `src/main/wsl/errorGlossary.ts`. Add an entry here (with a `relatedLessonId` pointing at whichever lesson best explains the concept) whenever you notice an exercise is likely to produce a diagnostic that isn't already covered.
- `content/trivia/history-cards.json` entries must be factually accurate — these are real Unix/C history, not lab lore. Keep them short (2–4 sentences) and cite them from `lesson.json#historyCardIds` only where they're genuinely on-topic.

## Validating your work

There's no separate lint step yet beyond the loader itself: `npm run dev` and open the lesson in-app — `contentLoader.ts` runs every file through its Zod schema at load time and throws immediately on anything malformed, with the failing file's path in the error. `npm run test` also exercises `contentLoader.ts` against the full `content/` tree (see `test/unit/contentLoader.test.ts`).
