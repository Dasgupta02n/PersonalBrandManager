# Design system

Design for discretion, not for self-promotion. The audience is senior, busy and wary of looking
boastful; the product should feel like a calm, private notebook with a careful editor, not a
growth tool. Evidence and reasoning: `docs/research/personas-and-ui-psychology.md`.

## Principles

1. **Calm, factual, private.** Warm paper and ink, no gradients, no confetti, no growth-hacker
   language.
2. **One primary action per screen**, within thumb reach on a phone.
3. **Show the source.** Every draft says it was built only from the user's wins; every warning
   says what triggered it.
4. **Few, specific warnings.** Three tiers (block, note, suggestion); never a wall of red.
5. **Forgive, don't punish.** No streaks; a forgiving workday count and a calm comeback.
6. **The user's words win.** Drafts are editable everywhere; comments are starters, not scripts.

## Colour

Tokens in `src/app/globals.css`; every pair below passes WCAG 2.x AA on paper.

| Token | Light | Use |
|---|---|---|
| `background` (paper) | `#FAF8F3` | Page |
| `surface` (inset) | `#F2EEE6` | Tonal panels instead of white cards |
| `foreground` / `ink` | `#17161A` | Text and primary buttons (16.97:1) |
| `muted` | `#5B5852` | Secondary text (6.68:1) |
| `accent` (indigo) | `#3E3A8C` | Links (always underlined) and focus only (9.04:1) |
| `brass` | `#7A5A1C` | The user's achievements: counts, praise (5.98:1) |
| `brass-fill` / `seal` | `#B08D57` | Fills behind ink text; logo centre |
| `success` | `#2E6B4E` | Always with an icon and a label |
| `danger` | `#B3261E` | Always with an icon and a label |

Dark mode: canvas `#141311`, ink text `#ECE8E1`, indigo `#ACAEF6`, brass `#D4B06A`; the seal
darkens to `#8C6A26` so the light square keeps contrast. No amber anywhere: amber reads as a
warning to this audience. Status is never colour alone.

## Type

- **UI:** Inter, 16px base, ratio ~1.25.
- **Display:** Fraunces with `SOFT 0` and `WONK 0` (editorial, not retro), via the
  `font-display` utility; sizes `text-display-xl` (40/56px), `text-display-l` (32px),
  `text-display-m` (25px).
- **LinkedIn preview:** the system UI stack, to look like the feed.

## Brand mark

A seal: a ring and a brass centre in an ink rounded square (`src/components/brand.tsx`). Draft
for approval; test at 16/32/48/192px. The name is a placeholder in `APP_NAME`; avoid "brand" in
the final name.

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
| Today | Find my wins | Greeting; "X of the last 5 workdays · N wins this month" in brass; comeback after 3+ missed workdays; chips for quick starts; voice dictation; ideas with the best one marked Suggested |
| Draft | Copy post | Verdict (safe / how it reads / sounds like you) above the draft; safer-version suggestion; preview with "…see more" marker; revisions; "How it reads" by reader; sticky Copy → Open LinkedIn → Mark as posted |
| Drafts | Open a draft | Segmented Ready / Needs a look / Posted; rows show the first line and the rest |
| Comment | Get starters | Paste a post; 2–3 approaches with an opening line and what to add; "Write it myself" |
| Wins ("Your record") | Log today's first win (empty) | Tabs: Wins, This week, Profile & CV, Export. Grouped by month; filter by kind; praise in brass; copy as a list |
| This week | Log it | Opportunities first (brass when there are any), workdays logged "x of y", wins, posts; last four weeks; one calm next-week suggestion |
| Profile & CV | Suggest updates | Optional pasted current text; each suggestion checked like a post, with reason, where to paste it, Copy and "I've updated it" |
| Export | Copy for your appraisal | 3, 6 or 12 months ("Your year in wins"); grouped by topic, praise apart; download as text; print or save as PDF |
| Setup | Continue | Five steps, one question each, sticky Back/Continue; consent on step 1 |
| Plan, data and privacy | Download everything | Plan and a usage bar in words ("Plenty left"), never credits; delete account behind a typed confirmation |
| Free post check (public) | Check my post | Runs in the browser; results by tier; what the full check adds |
| Landing | Join the beta | Leads with the check and the record; comparison with a general AI assistant; one global price |

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
countdown timers, amber warnings, white cards with drop shadows.

## To validate in beta

5-second test of paper/ink vs a blue-primary variant; Fraunces vs Source Serif 4; whether brass
reads as "earned" or "wealth" in India and the Gulf; logo legibility at small sizes.
