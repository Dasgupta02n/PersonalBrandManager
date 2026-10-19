# Privacy: data map and breach runbook

The public notice is `src/app/privacy/page.tsx` (version in `PRIVACY_NOTICE_VERSION`). Before
launch it needs the legal entity's name and address, a legal review, and a working
`privacy@c7xai.in` mailbox (`PRIVACY_EMAIL`).

## Data map

| Data | Where | Who can read it | Retention |
|---|---|---|---|
| Account (email, name, photo) | Supabase Auth, Mumbai | The user; service role | Until account deletion |
| Settings, rules, topics, voice samples | Supabase Postgres, Mumbai | The user (row-level security) | Until changed or deleted |
| Notes and wins | Supabase Postgres, Mumbai | The user | Until deleted |
| Drafts, opportunities, profile suggestions | Supabase Postgres, Mumbai | The user | Until deleted |
| AI usage (task, model, tokens, cost; no content) | Supabase Postgres, Mumbai | Service role only | Kept without the user id after deletion |
| Text sent to AI | OpenRouter → Google Vertex AI | Processed only | Zero data retention |
| App logs | Hostinger VPS, Mumbai | Operators | Never log note or draft content |

Sub-processors: Supabase, Hostinger, OpenRouter, Google Cloud Vertex AI, and Paddle once billing
opens. Add any new one to the notice before it receives data, and bump the notice version if
the change is material (users are asked to agree again).

## Rights requests

- **Access and portability:** Settings → Plan, data and privacy → Download everything.
- **Correction:** in the app.
- **Deletion and withdrawing consent:** the same page; cascades to every user table.
- **Anything else** (nomination, complaints): by email. Reply within 30 days.

## If there is a breach

1. **Contain** (first hour): revoke exposed keys (Supabase secret key, OpenRouter key), rotate
   them in Hostinger Docker Manager, block the access path, preserve logs.
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
