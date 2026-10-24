# Privacy: data map and breach runbook

The public notice is `src/app/(site)/privacy/page.tsx` (version in `PRIVACY_NOTICE_VERSION`). Before
launch it needs the legal entity's name and address, a legal review, and a working
`privacy@c7xai.in` address (`PRIVACY_EMAIL`), an alias that delivers to the hello@c7xai.in mailbox.

## Data map

| Data | Where | Who can read it | Retention |
|---|---|---|---|
| Account (email address only; sign-in by one-time code or link, no password) | Our PostgreSQL on the VPS, Mumbai | Server code only | Until account deletion |
| Sign-in codes and sessions (keyed hashes only, plus a keyed hash of the IP address for rate limits) | Our PostgreSQL, Mumbai | Server code only | Codes: expire in 15 minutes, deleted after a day. Sessions: until sign-out, 180 days unused, or deletion |
| Sign-in emails (address, one-time code and link) | Sent from hello@c7xai.in through Hostinger's mail servers | The recipient | Codes and links expire in 15 minutes |
| Settings, rules, topics, voice samples | Our PostgreSQL, Mumbai | The user (row-level security) | Until changed or deleted |
| Notes and wins | Our PostgreSQL, Mumbai | The user | Until deleted |
| Style notebook (style notes, edit counts, single removed words) | Our PostgreSQL, Mumbai | The user | Until cleared or the account is deleted |
| Drafts, opportunities, profile suggestions | Our PostgreSQL, Mumbai | The user | Until deleted |
| Network: setup answers, contacts the user adds (name, role, organisation, optional email and profile link, notes), conversation log, next steps, roles, AI suggestions of companies and job titles | Our PostgreSQL, Mumbai | The user (row-level security; interactions and roles can only point at the same user's contacts) | Until deleted; cascades with the account |
| AI usage (task, model, tokens, cost; no content) | Our PostgreSQL, Mumbai | Server code only | Kept without the user id after deletion |
| Text sent to AI, with people's names (the user's own, their contacts', and any the name model or lists find) and never-mention terms replaced by placeholders first | OpenRouter → Google Vertex AI | Processed only | Zero data retention |
| Text read by the privacy service (name finding, search embeddings) | `pbm-privacy` on our VPS, Mumbai; private network, no internet | Nobody: not logged or stored (line hashes and spans cached in the app's memory only) | Only while processing |
| Search index (a 384-number vector per win, `wins.embedding`) | Our PostgreSQL, Mumbai | The user | Deleted with the win; recomputed when a win changes |
| App logs | Hostinger VPS, Mumbai | Operators | Never log note or draft content |
| Database backups (everything above), encrypted with our passphrase (AES-256) | The VPS, Mumbai; Google Drive | Operators with the passphrase; Google sees only encrypted files | 14 days on the server, 30 days on Google Drive |
| Weekly snapshots of the whole VPS (not encrypted by us) | Hostinger backup servers, most likely Kuala Lumpur, Malaysia | Hostinger, operators | Hostinger's retention (to confirm) |

Sub-processors: Hostinger, Google (Drive for encrypted backups; Cloud Vertex AI for the model),
OpenRouter, and Paddle once billing opens. Add any new one to the notice before it receives data, and bump the notice version if
the change is material (users are asked to agree again).

## How the product learns

Only three ways, all consistent with "we never use what you write to train AI models":

1. **A private style notebook per user,** in their own account, used only for their drafts. It
   is visible and editable, and deleted with the account.
2. **Counts with no text,** such as which formats get picked or how often a check is overridden,
   used as totals to tune the product.
3. **Examples and test sets we write or commission.** User text never goes into test sets,
   shared examples or model training.

Bump `PRIVACY_NOTICE_VERSION` when the notice changes materially; everyone is asked to agree
again on their next visit.

## Names and the AI

`runStructured` (`src/lib/ai/client.ts`) passes every prompt through `protectPrompt`
(`src/lib/privacy/detect.ts`) before it leaves the server: the user's own name, their contacts,
names found by the BERT-NER model in `pbm-privacy` and by the name lists (`src/lib/privacy/names.ts`)
become `[Person N]`; never-mention terms and an employer the user won't name become `[Private N]`.
Names are put back only in what the user sees (or become "a colleague" when "keep names out" is
on); private terms never come back. If `PRIVACY_URL` is set and the service fails, the AI call
throws and nothing is sent. Measured on fictional notes (re-checked 2026-10-24): 69 of 69 names on the
tuning set and 47 of 48 on a held-out set; 2 of 20 name-free notes had a word wrongly masked. Misses are
possible, so the AI prompt also says to refer to people by role and never to guess a name.

## People in a user's network

Contacts are third parties' personal data that a user types in to manage their own professional
relationships. We act for the user: nothing is shared, enriched from other sources, or used to
contact anyone, and nothing is sent to the people themselves. The AI never receives a contact's
name. The search firm directory (`src/lib/network/firms-data.ts`) holds firm-level facts from each
firm's own website and no personal data. If a person asks about data a user holds on them, we pass
the request to that user and help where the law requires. Terms section 7 asks users to add only
people they have a genuine professional reason to contact, and never bought or scraped lists.

## Rights requests

- **Access and portability:** Settings → Plan, data and privacy → Download everything.
- **Correction:** in the app.
- **Deletion and withdrawing consent:** the same page; cascades to every user table.
- **Anything else** (nomination, complaints): by email. Reply within 30 days.

## If there is a breach

1. **Contain** (first hour): revoke exposed keys (OpenRouter key, database passwords, `AUTH_SECRET`,
   the mailbox password), rotate them in Hostinger Docker Manager (a new `AUTH_SECRET` signs
   everyone out), block the access path, preserve logs.
2. **Assess** (same day): what data, whose, how many people, which countries. Notes and drafts
   count as sensitive: they name colleagues and clients.
3. **Notify**, as each law requires:

| Law | Who to tell | When |
|---|---|---|
| India, DPDP Act and Rules 2025 | Data Protection Board and every affected user | Without delay; the Board's detailed report within 72 hours |
| UK and EU GDPR | ICO or the lead EU authority; users if the risk is high | Within 72 hours of becoming aware |
| Singapore PDPA | PDPC; affected users if significant harm is likely | Within 3 calendar days of deciding it is notifiable |
| UAE PDPL | UAE Data Office; affected users | Promptly on becoming aware (implementing rules pending) |
| US state laws | Affected residents, some state attorneys general | Varies by state; California says "most expedient time possible" |

4. **Tell users plainly:** what happened, what data, what we did, what they should do, and who
   to contact.
5. **Review** within two weeks: root cause, fix, and what changes in this runbook.
