# Writing test sets

The test sets in `evals/data/` measure every AI function against a strong single-prompt
baseline. They must be good enough that a senior professional would recognise the cases as
real.

## Hard rules

- **Synthetic only.** Never copy or adapt anything a user wrote. Every person, employer, client,
  product and project is fictional. Real organisations must never appear (the validator checks a
  list). LinkedIn itself may be mentioned.
- **Personas.** Every case uses a persona from `personas.json` by id (`p01`–`p12`). Match their
  market (currency, spelling, vocabulary), role, seniority, tone and confidentiality rules.
- **Shapes.** Each set matches its schema in `evals/lib/schema.ts`. Ids look like `note-001`;
  win ids look like `w001` and are unique within a case. Dates fall between 2025-11-01 and
  2026-10-15.
- **Parts.** A set may be split into `<name>.part1.json`, `<name>.part2.json` and so on; they are
  merged in file-name order. Ids must be unique across parts.
- **Validate.** `npx vitest run evals/data.test.ts` must pass. It checks shape, sizes, balance
  and that no real organisation appears. While rewriting a set in parts, `EVAL_REQUIRE_ALL=0`
  relaxes the size and balance checks.

## What makes a good case

- **Specific and plausible.** Real work at the persona's level: decisions, trade-offs, people,
  numbers in the right currency and scale. No filler.
- **Varied.** Different situations, lengths and quality of writing. Daily notes are often rushed
  fragments; posts range from strong to weak as each set requires.
- **Hard cases.** Include subtle ones as well as obvious ones: risks that are implied rather than
  stated, near-misses that look risky but aren't, notes where the win is buried.
- **Honest labels.** A label states what a careful senior reviewer would conclude. If a case is
  ambiguous, rewrite it until it isn't.
