# Product Requirements — Personal Brand Manager (Beta)

Working name. The product name is set in one place (`APP_NAME`) so it can change without code edits.

## 1. Summary

A pre-post check and a private record of real work, for employed professionals who know they
should be visible on LinkedIn but rarely post. The user spends about a minute a day noting what
moved forward at work. Every draft is checked for what their employer, clients and peers will see
before they see it; drafts, comment starters, profile and CV updates and appraisal summaries are
built only from the record. The drafting is the easy part; the check and the record are what we
sell, and the record is worth renewing for even in weeks the user doesn't post.

**Promise:** Nothing you'll regret posting.

**Tagline:** Be known for the work you already do.

**Platform focus:** LinkedIn only. Other networks are out of scope for the beta.

**Market:** global from day one, in English, at one price everywhere. Go-to-market channels and
targeting are decided later.

**The real alternative** is a free general AI assistant plus the safety of staying silent, not
other LinkedIn tools. The product must be visibly better than a well-prompted general assistant
at every function (see section 10).

## 2. Problem

Capable professionals stay silent on LinkedIn because each post raises four questions, in this
order of weight:

1. **What do I post?** Their best work is forgotten by the time it matters, and "my week" never
   feels post-worthy.
2. **Will it be well received?** Fear of sounding boastful, generic or needy.
3. **Will it clash with my job or who I am?** Confidential details, outshining a boss or client,
   job-hunting signals, a tone that isn't theirs.
4. **How do I write it?** Most are not copywriters and have full calendars.

Silence has a cost: trust, referrals, promotions, board seats and inbound opportunities go to
people whose work is visible. Market context (fewer openings, more applicants per role) supports
this but is never the headline and never framed as fear.

The product answers the four questions in order: it suggests what to post from the user's own
wins, reads each draft as a peer, their leadership and a client or recruiter would, checks it
against their confidentiality rules, no-go topics and tone, and writes the draft for them.

## 3. Target users

From the persona research (`docs/research/`), each persona with its correction:

- **The Quiet Achiever** (e.g. VP Sales, Mumbai). Modest by habit and culture; the barrier is
  permission, not motivation. Pep talks don't help; "we" framing, credit to the team and a
  safety check do.
- **The Transformation Leader** (e.g. Head of Digital Transformation at a bank, London or Dubai).
  New skills have no standard scorecard. Authority must be earned through explained decisions,
  not claimed.
- **The Independent Expert** (e.g. fractional CMO, Dubai). Referred clients check them before
  they call; LinkedIn's job is to confirm, not to broadcast.

Not for: active job seekers who want volume, creators chasing reach, early-career users, and
anyone wanting automation.

## 4. Product principles (non-negotiable)

1. **The user approves everything.** The product never posts, comments, reacts, connects or edits
   a profile on the user's behalf. Every outgoing action is a final tap by the user.
2. **No LinkedIn automation or scraping.** The product never logs in to LinkedIn, never reads
   LinkedIn pages on its own, and never automates the LinkedIn site. Content from LinkedIn
   reaches the product only when the user shares it (pasted text, screenshot, uploaded export).
3. **Real facts only.** Drafts may use only facts from the user's wins, profile and CV. Never
   invent or inflate a number, title, client, date or result.
4. **Discreet.** Nothing may signal that the user is looking for a job.
5. **Confidential.** Checks keep employer-sensitive details (named clients, internal figures,
   unannounced plans, no-go topics) out of public drafts, automatically. Other people's names
   are kept out of the stored record by default. Checks are a careful second read, never
   presented as legal or compliance clearance.
6. **The user's data is theirs.** Never sold or shared, never used to train AI models;
   exportable and deletable at any time, with consent recorded. The product learns in three
   ways only: a private style notebook in each user's account, counts with no text, and
   examples we commission from experts.
7. **No dark patterns.** No streaks, guilt or loss-framing. Consistency is counted forgivingly
   (workdays logged in a recent window) and a gap is met with a calm comeback. Renewal reminders
   and one-tap cancellation.

## 5. Beta scope

### 5.1 First-run setup (target: first draft within about 5 minutes)

A five-step wizard, one question per screen:

| Step | Asks |
|---|---|
| About you | Name, role; consent to the privacy notice |
| Topics | What they want to be known for (topic pillars) and the audience |
| Safety | Employer-name policy, never-mention list, number policy, no-go topics, tone, regulated firm, keep names out |
| Rhythm | When to ask, and a routine cue ("after my last meeting") |
| First win | "What moved forward today?" — optional; processed straight into wins and ideas |

Settings reuse the same fields in sections (about, topics, safety, fit, voice, rhythm). Imports
(LinkedIn PDF/export, CV) and voice learning from past posts follow in later milestones.

Sign-up: email only, with a one-time code and link in one email. No password, and no Google,
Microsoft or LinkedIn sign-in, so nothing ties the account to an employer's systems; the sign-in
page suggests a personal email.

### 5.2 Daily capture

- A daily prompt at the user's chosen local time: "What moved forward today?"
- Reply by text or voice (browser dictation now; WhatsApp and email reply later).
- Quick-start chips: Moved forward, Unblocked, Decided, Helped someone, Praise I received, Learned.
- At most one follow-up question per entry to fill in a missing number or name.
- Each entry is stored as written or, with "keep names out" on (the default), with other people
  referred to by role and never-mention terms masked. It is extracted into structured **wins**:
  summary, impact, metric (if stated), kind (result, decision, unblocked, helped, praise,
  lesson), skills, topic pillar, confidentiality flag, date.
- **Your record** (wins bank): grouped by month, filter by kind, copy as a list, delete. Tabs for
  This week, Profile & CV and Export sit alongside it.

### 5.3 Daily creation

- **Ideas:** 2–3 ways to share a recent win, best first ("Suggested"), each in a format that lands
  well for this audience: a lesson, a decision explained, credit to the team, a practical how-to.
  Suggested when the user asks on Today (and straight away for the first note at sign-up), so the
  user chooses when to think about posting.
- **Style notebook** ("How you write"): a private notebook of how the user writes, learned from
  their sample posts and from the edits they make before posting (words they remove, "we"
  instead of "I", no emojis, formats they pass over, revisions they choose). Style only, never
  content. Every draft follows it; the user can see, add, remove and clear notes. Kept in their
  account, used only for their drafts, never used to train AI models.
- **Drafts** in the user's tone: a first line under 140 characters, then result → credit →
  lesson → takeaway → a specific question; 120–220 words; 0–3 hashtags.
- **Verdict before the draft:** three lines — is it safe to post, how it reads (confident,
  boastful, too modest, generic), does it sound like you.
- **How it reads:** the draft read as a peer, their leadership and a client or recruiter would,
  with quoted lines to change and a suggested fix ("Use this").
- **Revisions:** Shorter, More modest, Stronger first line; free editing with a re-check.
- **LinkedIn preview** with the "…see more" cut-off marked.
- **Publish:** Copy post → Open LinkedIn → Mark as posted (optional link), with undo.

### 5.4 Engagement

- **Comment starters:** the user pastes a post (screenshot later) and gets 2–3 approaches, each
  with an opening line and what to add from their own experience. The user finishes the comment;
  "Write it myself" is always available.
- **Reply drafts** for comments on the user's own posts (later).
- **Watch list** reminders (later). The product never reads anyone's activity.

### 5.5 Profile and CV refresh

- On demand (weekly prompt later): headline, About, current-role bullets, CV bullets and skills,
  built from the last year of wins. The user may paste their current text; we never read
  LinkedIn.
- Each suggestion is checked like a post (confidentiality, employer policy, figures, job-search
  signals), copied by the user, and marked "updated".
- A tip to turn off LinkedIn's profile-update notifications before editing.
- Later: CV documents (DOCX and PDF), version history, side-by-side diff.

### 5.6 Weekly scorecard (opportunities first)

| Block | Source |
|---|---|
| Opportunities that came to you | "Log an opportunity" (Today link and This week) |
| Consistency | Workdays logged this week, wins logged, posts published (product data) |
| Last four weeks | The same counts, week by week |
| Next week | One calm suggestion from simple rules (ready drafts, unposted wins, logging rhythm) |
| Reach (later) | LinkedIn analytics screenshot shared by the user |

### 5.7 Record exports

- Appraisal summary for the last 3, 6 or 12 months ("Your year in wins"), grouped by topic with
  results first and praise apart; optional removal of confidential wins.
- Copy for an appraisal form, download as text, print or save as PDF. Plain code, no AI cost.
- Later: a "year in wins" email before each annual renewal.

### 5.8 Free post check (public)

- `/check`: paste a draft, optionally add an employer, names to keep out, a figures policy and
  regulated-firm mode. Runs the deterministic checks in the browser; nothing is sent or stored.
- Adds a named-client heuristic and "not yet public" phrases; shows what the full check adds.
- Common questions for search ("Is it OK to post about a client win?").

### 5.9 Plans, account and privacy

- Pricing: one global price (see `docs/PRICING.md`). Membership $29 a month or $319 a year;
  first month $9.50 for 30 days. Sized to fund the multi-pass quality pipeline. Each plan has a monthly AI allowance that keeps input cost at or
  below 30% of revenue; a calm note appears only from 80% used. No credit counters.
- Plans live in a table users can read but not change. Billing (Paddle) comes later; the private
  beta is free.
- Consent to the privacy notice at setup (and once for existing accounts), with version and date.
- Download everything (JSON), delete the account and everything in it, privacy notice with
  sub-processors and hosting region (Mumbai).

### 5.10 Out of scope for beta

Native mobile apps (beta is an installable PWA), team/company accounts, networks other than
LinkedIn, newsletters, carousel/video posts, one-tap publishing via the LinkedIn API (only after
Community Management API approval), job-search add-on.

## 6. Key user journeys

1. **First run:** sign up → five-step setup → first win → ideas → first checked draft, within
   about 5 minutes.
2. **Typical day:** prompt arrives → one line → ideas → pick one → read the verdict → adjust →
   copy, post, mark as posted.
3. **Engagement:** paste a post → pick an approach → finish the comment in their own words.
4. **Comeback:** after three or more missed workdays, Today shows a calm "pick up where you left
   off" instead of a broken streak.
5. **Weekly:** read This week → log opportunities → refresh profile and CV suggestions → copy
   what fits. **Review season:** Export → copy the summary into the appraisal form.

## 7. Guardrails

Checks run on every draft before the user sees it. Deterministic checks (term lists, patterns)
run first; AI checks (grounding, confidentiality, hierarchy, how it reads) run second. One
automatic fix is attempted; the safer version is offered, never forced.

| Tier | Checks | Handling |
|---|---|---|
| 1 — Blocking | Never-mention terms, employer-name policy, number policy, no-go topics, AI confidentiality findings; in regulated-firm mode, promissory and performance language | Copying is blocked until fixed or the user acknowledges "Post anyway — I have permission" |
| 2 — Worth a look | Job-search signals, claims not found in the wins, outshining a boss or client, words suggesting something isn't public yet | A visible note; never blocks |
| 3 — Style | Clichés, humblebrag, AI-sounding phrases, "it's not X, it's Y", bait closers, more than 3 hashtags, length | Quiet suggestions |

Check health is tracked in beta: any Tier 2 or 3 check that users override most of the time is
retuned. Regulated-firm mode also reminds the user to get their firm's approval before posting.

## 8. Success metrics (beta)

| Area | Metric |
|---|---|
| Activation | First checked draft within the first session; first post published within 7 days |
| Habit (north star) | Self-initiated logs per active week; workdays logged per week; comeback rate after gaps of 3+ days; week-4 and week-8 retention |
| Trust | Edit distance between draft and posted text; draft-to-posted rate; "How it reads" fixes used |
| Value | Posts published per week; opportunities logged per user per month, by type; NPS |
| Business | Paid conversion and churn by regional price point |

Target values are set before the beta cohort starts.

## 9. Non-functional requirements

- Mobile-first, installable PWA; works on 4G; 44px+ touch targets; WCAG 2.x AA contrast.
- Privacy: GDPR (EU/UK), DPDP (India), PDPL (UAE), PDPA (Singapore), CCPA (California).
  Encryption at rest. Audit log of account-level actions. AI calls only to zero-data-retention
  hosts.
- Observability: errors, uptime, AI cost per user, message delivery failures.

## 10. Quality bar

Every function must beat the strongest single prompt we can write for the same model, given all
the context a user could reasonably paste, in blind ratings by senior professionals and
experienced ghostwriters. The safety check must catch at least 95% of a labelled set of risky
posts. No quality change ships without beating both the current version and that baseline.
The harness, test sets and pass rules are in `evals/` (see `evals/README.md`).

## 11. Open decisions

- Product name and logo (the seal mark is a draft; avoid "brand" in the name).
- Validate the palette, serif and brass in a 5-second test (see `docs/DESIGN.md`).
- Legal entity (needed in the privacy notice) and billing provider (Paddle assumed in pricing).
- Default AI models per task (all functions use Claude Opus 5.5 via OpenRouter). Extra quality
  passes need budget that caching and overnight batch can only partly fund.
