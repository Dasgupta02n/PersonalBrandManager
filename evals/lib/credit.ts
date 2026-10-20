// What the OpenRouter account can still spend, so a run never starts more than it can pay for.

const API = "https://openrouter.ai/api/v1";

async function read(path: string, apiKey: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API}/${path}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: Record<string, unknown> }).data ?? null;
  } catch {
    return null;
  }
}

/** Remaining credit in US dollars: the lower of the account balance and the key's own limit. Null if unknown. */
export async function creditLeft(apiKey: string): Promise<number | null> {
  const [credits, key] = await Promise.all([read("credits", apiKey), read("key", apiKey)]);
  const left = [
    typeof credits?.total_credits === "number" && typeof credits.total_usage === "number" ? credits.total_credits - credits.total_usage : null,
    typeof key?.limit_remaining === "number" ? key.limit_remaining : null,
  ].filter((x): x is number => x !== null);
  return left.length ? Math.min(...left) : null;
}

/** OpenRouter's answer when the account can't cover a call. */
export const isCreditError = (message: string) => /\b402\b|payment_required|billing_error/i.test(message);
