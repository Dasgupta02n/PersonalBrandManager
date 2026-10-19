# Product Requirements — Personal Brand Manager (Beta)

Working name. The product name is set in one place (`APP_NAME`) so it can change without code edits.

## 1. Summary

A private, facts-first ghostwriter for employed professionals who know they should be visible on
LinkedIn but rarely post. The user spends about a minute a day noting what moved forward at work.
The product turns those real wins into LinkedIn posts and comment starters, checks every draft
before the user sees it, keeps their LinkedIn profile and CV current, and reports a weekly
scorecard led by the opportunities that came to them.

**Promise:** Nothing you'll regret posting.

**Tagline:** Be known for the work you already do.

**Platform focus:** LinkedIn only. Other networks are out of scope for the beta.

**Market:** global from day one (English first), starting with India, the UAE, the UK,
Singapore and the US.

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
   unannounced plans, no-go topics) out of public drafts, automatically.
6. **The user's data is theirs.** Never sold or shared; exportable and deletable at any time.
7. **No dark patterns.** No streaks, guilt or loss-framing. Consistency is counted forgivingly
   (workdays logged in a recent window) and a gap is met with a calm comeback. Renewal reminders
   and one-tap cancellation.

## 5. Beta scope

### 5.1 First-run setup (target: first draft within about 5 minutes)

A five-step wizard, one question per screen:

| Step | Asks |
|---|---|
| About you | Name, role, tone (reserved / balanced / open) |
| Topics | What they want to be known for (topic pillars) and the audience |
| Safety | Employer-name policy, never-mention list, number policy, no-go topics |
| Rhythm | When to ask, and a routine cue ("after my last meeting") |
| First win | "What moved forward today?" — optional; processed straight into wins and ideas |

Settings reuse the same fields in sections (about, topics, safety, fit, voice, rhythm). Imports
(LinkedIn PDF/export, CV) and voice learning from past posts follow in later milestones.

Sign-up: email magic link, Google, Microsoft; "Sign in with LinkedIn" (OpenID Connect) for name,
email and photo only.

### 5.2 Daily capture

- A daily prompt at the user's chosen local time: "What moved forward today?"
- Reply by text or voice (browser dictation now; WhatsApp and email reply later).
- Quick-start chips: Moved forward, Unblocked, Decided, Helped someone, Praise I received, Learned.
- At most one follow-up question per entry to fill in a missing number or name.
- Each entry is stored verbatim and extracted into structured **wins**: summary, impact, metric
  (if stated), kind (result, decision, unblocked, helped, praise, lesson), skills, topic pillar,
  confidentiality flag, date.
- **Your record** (wins bank): grouped by month, filter by kind, copy as a list, delete.

### 5.3 Daily creation

- **Ideas:** 2–3 ways to share a recent win, best first ("Suggested"), each in a format that lands
  well for this audience: a lesson, a decision explained, credit to the team, a practical how-to.
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

### 5.5 Weekly refresh (later milestone)

- Profile suggestions from the week's wins: headline, About, experience bullets, skills, featured.
- CV update: new version (DOCX and PDF), version history, side-by-side diff.
- Every change is approved by the user and copied into LinkedIn section by section.

### 5.6 Weekly scorecard (opportunities first, later milestone)

| Block | Source |
|---|---|
| Opportunities that came to you | One-tap "log an opportunity" + weekly question |
| Consistency | Workdays logged in the recent window, wins logged, posts published (product data) |
| Profile strength | Keyword coverage and completeness (product data) |
| Reach | LinkedIn analytics screenshot shared by the user (optional) |
| Next week | Suggested focus based on what worked |

### 5.7 Account, privacy, billing

- Data export (JSON + files), full deletion, pause, notification settings.
- Plans, free trial, beta coupons, regional pricing.

### 5.8 Out of scope for beta

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
5. **Weekly (later):** summary → approve profile and CV changes → read scorecard → log
   opportunities.

## 7. Guardrails

Checks run on every draft before the user sees it. Deterministic checks (term lists, patterns)
run first; AI checks (grounding, confidentiality, hierarchy, how it reads) run second. One
automatic fix is attempted; the safer version is offered, never forced.

| Tier | Checks | Handling |
|---|---|---|
| 1 — Blocking | Never-mention terms, employer-name policy, number policy, no-go topics, AI confidentiality findings | Copying is blocked until fixed or the user acknowledges "Post anyway — I have permission" |
| 2 — Worth a look | Job-search signals, claims not found in the wins, outshining a boss or client | A visible note; never blocks |
| 3 — Style | Clichés, humblebrag, AI-sounding phrases, "it's not X, it's Y", bait closers, more than 3 hashtags, length | Quiet suggestions |

Check health is tracked in beta: any Tier 2 or 3 check that users override most of the time is
retuned.

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

## 10. Open decisions

- Product name and logo (the seal mark is a draft; avoid "brand" in the name).
- Validate the palette, serif and brass in a 5-second test (see `docs/DESIGN.md`).
- Legal entity and billing provider (Stripe vs Paddle; Razorpay for India).
- Pricing tiers by market (INR well below the ~$39 USD anchor; premium tier for UAE/Singapore).
- Default AI models per task (all functions use Claude Opus 5.5 via OpenRouter; cheaper models
  can be set per function to reduce cost).
