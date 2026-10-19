import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DATASETS, type DatasetName } from "./schema";

export const DATA_DIR = join(__dirname, "..", "data");

/**
 * Reads a test set: `<name>.json`, plus any `<name>.part*.json` files (sets written in parts
 * are merged in file-name order). Null when none exist yet.
 */
export function loadRaw(name: DatasetName): unknown[] | null {
  const base = DATASETS[name].file.replace(/\.json$/, "");
  const files = readdirSync(DATA_DIR)
    .filter((f) => f === `${base}.json` || (f.startsWith(`${base}.part`) && f.endsWith(".json")))
    .sort();
  if (!files.length) return null;
  return files.flatMap((f) => JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")) as unknown[]);
}

/** A validated test set; throws with the first problems if it doesn't match its schema. */
export function load<N extends DatasetName>(name: N) {
  const rows = loadRaw(name);
  if (!rows) throw new Error(`Test set "${name}" has not been written yet (evals/data/${DATASETS[name].file}).`);
  const parsed = DATASETS[name].schema.array().safeParse(rows);
  if (!parsed.success) {
    throw new Error(`Test set "${name}" is invalid:\n${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  return parsed.data as ReturnType<(typeof DATASETS)[N]["schema"]["parse"]>[];
}

export function exists(name: DatasetName): boolean {
  return existsSync(DATA_DIR) && loadRaw(name) !== null;
}
