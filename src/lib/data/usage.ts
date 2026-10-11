import "server-only";
import type { UsageRecorder } from "@/lib/ai/client";
import { serverEnv } from "@/lib/config/env";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Records AI usage per user: the model and host that served the call, tokens and cost.
 * Never blocks or fails the user's action.
 */
export function usageRecorderFor(userId: string): UsageRecorder {
  return async (usage) => {
    if (!serverEnv().SUPABASE_SECRET_KEY) return;
    try {
      const { error } = await createAdminClient().from("ai_usage").insert({
        user_id: userId,
        task: usage.task,
        model: usage.model,
        provider: usage.provider,
        cost_usd: usage.costUsd,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cache_read_tokens: usage.cacheReadTokens,
        cache_write_tokens: usage.cacheWriteTokens,
        stop_reason: usage.stopReason,
      });
      if (error) console.error("ai_usage insert failed:", error.message);
    } catch (err) {
      console.error("ai_usage insert failed:", err);
    }
  };
}
