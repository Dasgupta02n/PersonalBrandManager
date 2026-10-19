-- The private style notebook: how one user writes, learned from their sample posts and the edits
-- they make before posting. Used only for that user's drafts; never used to train AI models.

alter table voice_profiles
  -- Observations learned by the AI from samples and edits, and notes the user added:
  -- [{ "key": "ai:1" | "you:<uuid>", "text": "...", "source": "learned" | "you" }]
  add column notes jsonb not null default '[]'::jsonb,
  -- Keys of observations the user removed, so they are never suggested again.
  add column muted text[] not null default '{}',
  -- Counts from edits, dismissed ideas and revisions (no text beyond single words removed).
  add column edit_stats jsonb not null default '{}'::jsonb,
  add column refreshed_at timestamptz;

-- The last version the AI wrote, so the edits the user makes before posting can be learned from.
alter table drafts
  add column ai_body text;
