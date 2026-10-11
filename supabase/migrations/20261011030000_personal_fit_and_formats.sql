-- "Nothing you'll regret posting": personal-fit settings, win types and post formats.

create type post_tone as enum ('reserved', 'balanced', 'open');
create type win_kind as enum ('result', 'decision', 'unblocked', 'helped', 'praise', 'lesson');
create type post_format as enum ('lesson', 'decision', 'credit', 'how_to');

-- Tone of drafts, and the routine the daily note is anchored to ("After I …").
alter table profiles
  add column tone post_tone not null default 'balanced',
  add column routine_cue text check (char_length(routine_cue) <= 120);

-- Topics the user never wants to post about (checked on every draft).
alter table confidentiality_rules
  add column no_go_topics text[] not null default '{}';

-- What kind of progress a win is; "praise" lets other people's words carry a post.
alter table wins
  add column kind win_kind not null default 'result';

-- The shape of a post idea or draft.
alter table drafts
  add column post_format post_format;
