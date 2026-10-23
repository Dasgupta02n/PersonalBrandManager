import "server-only";
import { asUser } from "@/lib/db/client";
import type { Db } from "@/lib/db/query";
import { embed } from "@/lib/privacy/detect";
import { rankWins, winText, type Ranked } from "@/lib/search/rank";

/** The embedding model the privacy service runs; wins embedded by another model are redone. */
export const EMBED_MODEL = "Xenova/bge-small-en-v1.5";

export interface SearchWin {
  id: string;
  occurred_on: string;
  summary: string;
  impact: string;
  metric: string | null;
  skills: string[];
  kind: string;
  confidential: boolean;
  pillar_id: string | null;
  embedding: number[] | null;
}

const COLUMNS = "id, occurred_on, summary, impact, metric, skills, kind, confidential, pillar_id, embedding, embedding_model";

/**
 * The user's wins with their vectors, embedding any that are missing first (on our own server).
 * If the model is unavailable, wins come back without vectors and search falls back to words.
 */
export async function loadSearchableWins(db: Db, userId: string, limit = 1000): Promise<SearchWin[]> {
  const { data, error } = await db.from("wins").select(COLUMNS).eq("user_id", userId).order("occurred_on", { ascending: false }).limit(limit);
  if (error) throw new Error(`Could not load wins: ${error.message}`);
  const wins = (data ?? []) as (SearchWin & { embedding_model: string | null })[];
  const stale = wins.filter((w) => !w.embedding?.length || w.embedding_model !== EMBED_MODEL).slice(0, 200);
  if (stale.length) {
    try {
      const result = await embed(stale.map(winText), "passage");
      if (result) {
        stale.forEach((w, i) => (w.embedding = result.vectors[i]));
        const rows = stale.map((w, i) => ({ id: w.id, e: result.vectors[i] }));
        await asUser(userId, (tx) =>
          tx`update wins as w
             set embedding = array(select jsonb_array_elements_text(d.e)::real), embedding_model = ${result.model}
             from jsonb_to_recordset(${tx.json(rows)}) as d(id uuid, e jsonb)
             where w.id = d.id and w.user_id = ${userId}`,
        );
      }
    } catch (err) {
      console.error("win embeddings:", err instanceof Error ? err.message : err);
      for (const w of stale) w.embedding = null;
    }
  }
  return wins;
}

async function queryVectors(texts: string[]): Promise<(number[] | null)[]> {
  try {
    const result = await embed(texts, "query");
    return result ? result.vectors : texts.map(() => null);
  } catch {
    return texts.map(() => null);
  }
}

/** Search the record by meaning and words. */
export async function searchRecord(db: Db, userId: string, query: string, limit = 15): Promise<{ results: Ranked<SearchWin>[]; byMeaning: boolean }> {
  const [wins, [vector]] = await Promise.all([loadSearchableWins(db, userId), queryVectors([query])]);
  return { results: rankWins(query, vector, wins, limit), byMeaning: vector !== null && wins.some((w) => w.embedding?.length) };
}

/** For each text (a role, a contact), the wins that best support it. */
export async function bestEvidence(db: Db, userId: string, texts: string[], perText = 3): Promise<Ranked<SearchWin>[][]> {
  if (!texts.length) return [];
  const [wins, vectors] = await Promise.all([loadSearchableWins(db, userId), queryVectors(texts)]);
  return texts.map((text, i) => rankWins(text, vectors[i], wins, perText));
}
