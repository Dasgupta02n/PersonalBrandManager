# Design system

Design for discretion, not for self-promotion. The audience is senior, busy and wary of looking
boastful; the product should read like a well-edited document with a careful editor, not a
growth tool or a launch page. Evidence: `docs/research/personas-and-ui-psychology.md`, and for the
visual system `/home/user/reports/Upmarket white web app UI design.md` (outside the repo; design
brief at its end).

One system for the public site and the app since 2026-10-22, after the owner rejected a
beige-paper-and-serif look as old-fashioned and a dark, gold and glow look as tacky. Both were
recognised template defaults; this system is built from refusals executed precisely.

## Principles

1. **Calm, factual, private.** White canvas, near-black ink, one quiet accent held in reserve,
   hairlines instead of shadows. No gradients, glows, glass, confetti or growth-hacker language.
2. **One primary action per screen**, within thumb reach on a phone. The primary is ink.
3. **Show the source.** Every draft says it was built only from the user's wins; every warning
   says what triggered it.
4. **Few, specific warnings.** Three tiers (Risk, Check, Style); never a wall of red.
5. **Forgive, don't punish.** No streaks; a forgiving workday count and a calm comeback.
6. **The user's words win.** Drafts are editable everywhere; comments are starters, not scripts.
7. **Real things only.** Real product screens, real facts with their caveats, no stock people,
   no invented counts, logos or testimonials.

## Colour

Tokens in `src/app/globals.css` (contrast on white, WCAG 2.x):

| Token | Hex | Use |
|---|---|---|
| `background` | `#FFFFFF` | Page and app canvas |
| `band` | `#F9FAFC` | Alternate page bands, footer |
| `surface` | `#F2F4F8` | Insets, screenshot stages, active nav, ghost hover |
| `border` | `#E4E6EB` | Hairlines (decorative) |
| `border-soft` / `border-strong` | `#C5CAD2` / `#868B93` | Secondary buttons / form controls (3.43:1) |
| `foreground` / `ink` | `#111419` | Text and the primary button (18.45:1) |
| `muted` | `#51555F` | Secondary text, nav (7.46:1) |
| `subtle` | `#6D727B` | Captions at 14px+ (4.84:1) |
| `accent` (ink blue) | `#2D4382` | Links (always underlined), focus, selection, progress, annotations (9.39:1). Never a fill, gradient or heading colour; about 5% of a screen at most |
| `brass` | = accent | Achievements read as progress, in ink blue (the old brass was dropped) |

Status colours belong to the post checker and mean nothing else. Text stays ink; colour lives in
the icon, the tint and the underline. Shape and word always carry the meaning:

| Status | Colour | Tint | Shown as |
|---|---|---|---|
| Risk | `#BC4947` (5.02:1) | `#FFF0EE` | Octagon icon, "Risk", tint plus solid underline in drafts |
| Check | `#BA7E15` (graphics only) | `#FFF7E5` | Triangle icon, "Check", dotted underline |
| Clear | `#0D4A22` (10.40:1) | `#EDF8EF` | Check-circle icon, "Clear" |

The public site is light only. The app follows the system's dark mode with the same hues lifted
(scoped to `.app-shell` in globals.css). Neutrals are cool throughout; never mix in warm greys.

## Type

- **One family: Schibsted Grotesk** (variable, 400–600 used, latin and latin-ext for ₹), self-hosted
  through `next/font` and applied at the root (`src/app/fonts.ts`). No serif, no italic accent words.
- Weights: 400 body, 500 headings, buttons and nav, 600 titles and status labels; never 700+.
- Scale (desktop / phone): display 60/38, h1 48/34, h2 36/28, h3 26/22, title 21/19, lead 21/19,
  body **18/17** with 1.55 leading, UI 16, captions 14; nothing smaller than 14px. Fluid with
  `clamp()`; site classes `t-display` … `t-caption`, app utilities `text-display-*`.
- Prose measure `35rem` (about 66 characters in this face; `66ch` would give about 88).
- Tabular figures only for dates and step numbers: in this face they also widen commas, colons and
  decimal points, so never on prose, tables or prices with decimals.
- The LinkedIn preview uses the system stack, to look like the feed.

## Brand mark

A small brick wall on an ink square, laid course by course like the record itself, with the newest
brick picked out (`src/components/brand.tsx`, `src/app/icon.svg`, `src/app/apple-icon.tsx`).
Monochrome; the wordmark is Schibsted Grotesk 600 in ink.

## Public site

Everything a visitor sees before signing in lives in `src/app/(site)` (home, product and trust
pages, the free check, sign-in), styled by `src/app/(site)/site.css` on the shared tokens.

- **Frame:** a solid white 72px header (60px and not sticky on phones) that gains a hairline once
  the page scrolls; five links, "Sign in", and one 40px ink button; a full-height white menu sheet
  on phones with a worded "Menu" button. A light footer on `band`.
- **Home, in order:** hero (promise left, a checked-draft screen right; top of the next section
  visible above the fold), four promises in plain lines, the five worries as question-and-answer
  rows, the real three steps with screen crops, the live check preloaded with a sample draft, the
  record with three annotated points, a hairline comparison table, who makes it and how it's
  tested (figures as sentences with their caveats), where your data lives (line diagram and list),
  one plan card, FAQ accordion, closing call to action. The ink button repeats after the steps,
  at pricing and at the end; on phones a slim sticky bar shows it once the hero button has gone.
- **Inner pages:** a white title block (breadcrumb, h1, lead, last reviewed), then a 45rem reading
  column with an optional sticky "at a glance" panel; hairline lists and tables, no cards.
- **Pictures:** crops of Winwall's own screens rebuilt in HTML with the app's tokens
  (`src/components/site/graphics.tsx`), on a `surface` stage with 16px corners, the screen at 12px
  on a hairline. No browser chrome, device frames, tilt, glow or shadow. At most three annotations
  per picture: an accent dot matched to a point beside it.
- **Shape:** 8px buttons and inputs, 12px cards and menus, 16px stages and the plan card; round
  only for status chips. Static surfaces get a hairline and no shadow; floating layers get one
  ring-plus-soft-shadow (`shadow-float`).
- **Motion:** hover colour 150ms, button press `scale(0.97)` for 100ms, the FAQ chevron 200ms, the
  phone action bar 250ms. Nothing animates on scroll, no marquees, carousels, count-ups or
  pulsing dots; everything settles under reduced motion.
- **Share image:** `src/app/opengraph-image.tsx`, white with the promise in ink.

## Layout

- One 640px column on every screen; 16px gutters on phones.
- Touch targets 44px minimum (buttons 44/48/52px for sm/md/lg).
- Phone: four bottom tabs — **Today, Drafts, Comment, Wins** — with an open-draft count on
  Drafts. Desktop: the same four in the header. Settings and sign-out are header icons.
- Pushed screens (a draft, setup) hide the tab bar and use a sticky bottom action bar
  (`data-pushed` on the screen root).

## Screens

| Screen | Primary action | Notes |
|---|---|---|
| Today | Find my wins | Greeting; "X of the last 5 workdays · N wins this month" in ink blue; comeback after 3+ missed workdays; chips for quick starts; voice dictation; ideas with the best one marked Suggested |
| Draft | Copy post | Verdict (safe / how it reads / sounds like you) above the draft; safer-version suggestion; preview with "…see more" marker; revisions; "How it reads" by reader; sticky Copy → Open LinkedIn → Mark as posted |
| Drafts | Open a draft | Segmented Ready / Needs a look / Posted; rows show the first line and the rest |
| Comment | Get starters | Paste a post; 2–3 approaches with an opening line and what to add; "Write it myself" |
| Wins ("Your record") | Log today's first win (empty) | Tabs: Wins, This week, Profile & CV, Export. Grouped by month; filter by kind; praise in ink blue; copy as a list |
| This week | Log it | Opportunities first (ink blue when there are any), workdays logged "x of y", wins, posts; last four weeks; one calm next-week suggestion |
| Profile & CV | Suggest updates | Optional pasted current text; each suggestion checked like a post, with reason, where to paste it, Copy and "I've updated it" |
| Export | Copy for your appraisal | 3, 6 or 12 months ("Your year in wins"); grouped by topic, praise apart; download as text; print or save as PDF |
| Setup | Continue | Five steps, one question each, sticky Back/Continue; consent on step 1 |
| How you write | Add a note | The style notebook: voice summary, notes with their source, words you remove (removable chips), "Learn from my latest writing", clear what was learned |
| Plan, data and privacy | Download everything | Plan and a usage bar in words ("Plenty left"), never credits; delete account behind a typed confirmation |
| Free post check (public) | Check my post | Runs in the browser; results by tier; what the full check adds |
| Landing | Join the beta | Checked-draft screen; the five worries; the live check on a sample draft; comparison with a general AI assistant and growth tools; one global price (see "Public site") |

## Copy

Serious, plain, specific; never cheerleading.

- Say what happened and what to do: "1 thing to fix before posting", not "Oops!".
- Name the reader: "May read as boastful to your leadership".
- Credit before claim; "we" is welcome.
- No exclamation marks, emoji, "crush it", "level up", streak language or fear of missing out.
- British spelling in UI copy (`en-GB`); drafts follow the user's own spelling.

## Usage and limits

No credit counters. The allowance appears only from 80% used, as one calm note on Today that
says when it renews, and as a bar described in words on the plan page. When it runs out, notes
are still saved.

## Not used

Streaks, leaderboards, badges, confetti, follower counts as goals, red notification dots,
countdown timers, cards with drop shadows. Nor the template tells: gradients (including gradient
text), aurora or glow backgrounds, glassmorphism, gold or metallic buttons, dark hero bands,
cream or beige canvases, italic serif accent words, pill badges above headlines, eyebrow labels,
icons in tinted squares, equal-card bento grids, stat banners, logo strips, decorative grid
backgrounds, sparkle icons for AI, stock or AI-generated people, fade-up on every section.

## To validate in beta

A five-second test with 20–30 target users comparing ink blue, ink only and a LinkedIn-blue
control (trustworthy, competent, premium, calm, "safe for my career"); Schibsted Grotesk at
14–18px in Chrome on Windows (fallback: Public Sans for app UI); the phone action bar as an A/B
test; logo legibility at 16px.
