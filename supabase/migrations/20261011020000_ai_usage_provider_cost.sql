-- AI calls go through OpenRouter: record which host served each call and what it cost.
alter table ai_usage
  add column provider text,
  add column cost_usd numeric(12, 6);
