-- Record search: each win's meaning as a vector, from our own embedding model (the privacy
-- service, on our server). Used to search the record and to pick the most relevant wins for a
-- role or a message. Wins already have row-level security and grants; new columns inherit them.

alter table wins
  add column embedding real[],
  add column embedding_model text;

-- An edited win is embedded again.
create function wins_clear_embedding() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.summary is distinct from old.summary or new.impact is distinct from old.impact or new.skills is distinct from old.skills then
    new.embedding = null;
    new.embedding_model = null;
  end if;
  return new;
end;
$$;
create trigger wins_clear_embedding before update on wins
  for each row execute function wins_clear_embedding();
revoke all on function wins_clear_embedding() from public;
