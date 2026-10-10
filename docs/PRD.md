# Product Requirements — Personal Brand Manager (Beta)

Working name. The product name is set in one place (`APP_NAME`) so it can change without code edits.

## 1. Summary

A personal brand manager for busy professionals. The user spends about a minute a day telling
the product what they did. The product turns that real work into LinkedIn posts, comments and
replies, keeps their LinkedIn profile and CV current every week, and reports a weekly brand
scorecard led by the opportunities that came to them.

**Value proposition:** Be known for the work you already do.

**Platform focus:** LinkedIn only. Other networks are out of scope for the beta.

**Market:** global from day one (English first), starting with India, the UAE, the UK,
Singapore and the US.

## 2. Problem

1. Fewer openings and more competition; strong CVs look the same; applying and waiting is fading.
2. New skills (AI, transformation, new business models) have no standard scorecard.
3. Trust and opportunity go to people who are visible in their field.
4. Most professionals are not copywriters, have full calendars, and forget their best work by
   the time it matters.

## 3. Target users

- **Primary:** directors, VPs, business heads and senior specialists, any industry, with a strong
  track record and little time to write.
- **Secondary:** independent consultants, fractional executives and advisors whose income
  depends on being known.

## 4. Product principles (non-negotiable)

1. **The user approves everything.** The product never posts, comments, reacts, connects or edits
   a profile on the user's behalf. Every outgoing action is a final tap by the user.
2. **No LinkedIn automation or scraping.** The product never logs in to LinkedIn, never reads
   LinkedIn pages on its own, and never automates the LinkedIn site. Content from LinkedIn
   reaches the product only when the user shares it (pasted text, screenshot, uploaded export).
3. **Real facts only.** Drafts may use only facts from the user's wins bank, profile and CV.
   Never invent or inflate a number, title, client, date or result.
4. **Discreet.** Nothing may signal that the user is looking for a job.
5. **Confidential.** A confidentiality filter keeps employer-sensitive details (named clients,
   internal figures, unannounced plans) out of public drafts.
6. **The user's data is theirs.** Never sold or shared; exportable and deletable at any time.

## 5. Beta scope

### 5.1 Onboarding (target: 15 minutes)

| Step | Requirement |
|---|---|
| Sign up | Email magic link, Google, Microsoft. "Sign in with LinkedIn" (OpenID Connect, self-serve) for name, email and photo only. |
| Import | Upload LinkedIn "Save to PDF" profile and/or LinkedIn data export (profile, positions, past posts). Upload CV (PDF or DOCX). |
| Voice | Learn writing style from past posts, or from 3 pasted samples. Store a voice profile the user can view and edit. |
| Direction | 3–5 topic pillars, target audience (industries, roles), posting frequency, time zone, language. |
| Confidentiality | Employer-name policy (name / generic / never), never-mention list (clients, products, projects), number policy (exact / rounded / relative only). |
| Channel | Daily prompt channel (WhatsApp, email or web push) and prompt time. |

### 5.2 Daily capture

- A daily prompt at the user's chosen local time: "What did you get done today?"
- Reply by text or voice note (transcribed) via WhatsApp, email reply, or the web app.
- At most one follow-up question per day to fill in a missing number or name.
- Each entry is stored verbatim and also extracted into structured **wins**:
  summary, impact, metric (if stated), skills, topic pillar, confidentiality flags, date.
- Wins bank: browse, edit, tag, delete.

### 5.3 Daily creation

- 2–3 post ideas per day from recent wins, the user's pillars and current industry news.
- Full drafts in the user's voice: hook, body, closing question, 3–5 hashtags, suggested posting
  time in the user's time zone. Actions: edit, shorten, change tone, regenerate.
- **Guardrail checks before the user sees a draft:** confidentiality, factual grounding,
  job-search signals, banned clichés. Failing drafts are revised or flagged.
- Publish: copy text and open LinkedIn; then "mark as posted" (optionally paste the post link).
- Content calendar: planned and published posts by day.

### 5.4 Engagement

- **Comment drafts:** the user shares a post (pasted text or screenshot on mobile; "draft comment"
  in the desktop browser extension for the post the user clicks) and gets 2–3 comment options.
- **Reply drafts** for comments on the user's own posts (pasted or screenshot).
- **Watch list:** people the user wants to build relationships with, with engagement reminders.
  The product does not read their activity; it reminds the user to check.

### 5.5 Weekly refresh

- Profile suggestions from the week's wins: headline, About, experience bullets, skills, featured.
- Keyword gaps versus what decision-makers in the target field search for.
- CV update: new version (DOCX and PDF), version history, side-by-side diff.
- Every change is approved by the user; profile changes are copied into LinkedIn section by section.

### 5.6 Weekly scorecard (opportunities first)

| Block | Source |
|---|---|
| Opportunities that came to you | One-tap "log an opportunity" + weekly question |
| Consistency | Streak, wins logged, posts published, comments made (product data) |
| Profile strength | Keyword coverage and completeness score (product data) |
| Reach | LinkedIn analytics screenshot sent by the user (optional), read by the product |
| Next week | Suggested focus based on what worked |

### 5.7 Account, privacy, billing

- Data export (JSON + files), full deletion, pause, notification settings.
- Plans, free trial, beta coupons, regional pricing.

### 5.8 Out of scope for beta

Native mobile apps (beta is an installable PWA), team/company accounts, networks other than
LinkedIn, newsletters, carousel/video posts, one-tap publishing via LinkedIn API (only after
Community Management API approval), job-search add-on.

## 6. Key user journeys

1. **First day:** sign up → import profile and CV → voice calibration → pillars and
   confidentiality → first win logged → first 3 post ideas shown within 60 seconds.
2. **Typical day:** prompt arrives → reply in one line → next morning, ideas and drafts are ready
   → edit → copy and post → mark as posted.
3. **Engagement:** share a post screenshot → pick one of three comment drafts → copy and post.
4. **Weekly:** Sunday summary → approve profile and CV changes → copy into LinkedIn → read
   scorecard → log any opportunities.

## 7. Guardrail rules

| Check | Rule | Handling |
|---|---|---|
| Confidentiality | No never-mention terms; employer name per policy; numbers per policy | Rewrite; if it still fails, block and explain |
| Grounding | Every number, title, client and date must appear in the wins bank, profile or CV | Remove or flag the unsupported claim |
| Job-search signals | No "open to opportunities", "my next chapter", "looking for my next role" and similar | Rewrite |
| Clichés | No "thrilled to announce", "humbled", "game-changer", "in today's fast-paced world" and similar | Rewrite |
| Length | Posts 120–220 words by default (user-adjustable); comments 1–4 sentences | Trim |

Deterministic checks (term lists, patterns) run first; an AI check runs second.

## 8. Success metrics (beta)

| Area | Metric |
|---|---|
| Activation | First win logged within 24 hours; first post published within 7 days |
| Habit | Logging 3+ days a week in week 4 |
| Value | Posts published per week; opportunities logged; NPS |
| Business | Paid conversion at beta end |

Target values are set before the beta cohort starts.

## 9. Non-functional requirements

- Mobile-first, installable PWA; works on 4G.
- Daily ideas ready before the user's morning (overnight batch per time zone).
- Privacy: GDPR (EU/UK), DPDP (India), CCPA (California). Encryption at rest. Audit log of
  account-level actions.
- Observability: errors, uptime, AI cost per user, message delivery failures.

## 10. Open decisions

- Product name and brand.
- Legal entity and billing provider (Stripe vs Paddle; Razorpay for India).
- Pricing tiers.
- Default AI models per task (all tasks default to Claude Opus 5.5; cheaper models can be set
  per task to reduce cost).
