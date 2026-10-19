import "server-only";
import { serverEnv } from "@/lib/config/env";
import { createAdminClient } from "@/lib/supabase/server";
import { allowancePeriod, allowanceStatus, exhaustedMessage, isExhausted, type AllowanceStatus } from "./allowance-period";
import { estimateCallCost, type PlanKind } from "./pricing";

export class AllowanceExhaustedError extends Error {
  constructor(public readonly status: AllowanceStatus) {
    super(exhaustedMessage(status));
    this.name = "AllowanceExhaustedError";
  }
}

interface UsageRow {
  model: string;
  cost_usd: number | string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

/** OpenRouter's reported cost, or an estimate from tokens when the cost wasn't reported. */
function rowCost(row: UsageRow): number {
  if (row.cost_usd !== null) return Number(row.cost_usd);
  return estimateCallCost(row.model, {
    input: row.input_tokens,
    output: row.output_tokens,
    cacheRead: row.cache_read_tokens,
    cacheWrite: row.cache_write_tokens,
  });
}

/**
 * The user's plan and how much of its AI allowance is used, from the real cost of each call
 * recorded in `ai_usage`. Null when the service key isn't configured (local development).
 */
export async function loadAllowance(userId: string, now: Date = new Date()): Promise<AllowanceStatus | null> {
  if (!serverEnv().SUPABASE_SECRET_KEY) return null;
  const admin = createAdminClient();

  const { data: sub, error: subError } = await admin
    .from("subscriptions")
    .select("plan, started_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (subError) throw new Error(`Could not load your plan: ${subError.message}`);

  const plan = (sub?.plan ?? "beta") as PlanKind;
  const startedAt = sub ? new Date(sub.started_at) : now;
  const { start } = allowancePeriod(plan, startedAt, now);

  const { data: rows, error } = await admin
    .from("ai_usage")
    .select("model, cost_usd, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());
  if (error) throw new Error(`Could not load your usage: ${error.message}`);

  const spent = (rows ?? []).reduce((sum, row) => sum + rowCost(row), 0);
  return allowanceStatus(plan, startedAt, spent, now);
}

/** Call before any AI step. Throws when the plan's allowance is used up. */
export async function requireAllowance(userId: string): Promise<AllowanceStatus | null> {
  const status = await loadAllowance(userId);
  if (status && isExhausted(status)) throw new AllowanceExhaustedError(status);
  return status;
}
