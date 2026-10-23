import type { NetworkGoals } from "./goals";
import { FIRMS_DATA } from "./firms-data";
import {
  FUNCTION_LABEL,
  MARKET_LABEL,
  SECTOR_LABEL,
  type FirmKind,
  type Func,
  type Market,
  type Sector,
  type Seniority,
} from "./taxonomy";

// The search firm directory: firm-level facts only, each checked on the firm's own website
// (`source`, on `checked`). No people, no contact details, nothing from LinkedIn. Users find the
// consultant who covers their area themselves, and add them by hand.

export interface Firm {
  /** A stable slug, stored on contacts added from the directory. */
  id: string;
  name: string;
  website: string;
  kind: FirmKind;
  markets: Market[];
  sectors: Sector[];
  functions: Func[];
  seniority: Seniority[];
  /** The page on the firm's site that lists its offices. */
  source: string;
  checked: string;
}

export const FIRMS: Firm[] = FIRMS_DATA;

export function firmById(id: string | null | undefined): Firm | undefined {
  return id ? FIRMS.find((f) => f.id === id) : undefined;
}

export interface FirmMatch {
  firm: Firm;
  score: number;
  /** Why it fits, in the user's terms: offices, practices, functions, level. */
  reasons: string[];
}

const THE = new Set<Market>(["AE", "GB", "US"]);
const placeName = (m: Market) => (THE.has(m) ? `the ${MARKET_LABEL[m]}` : MARKET_LABEL[m]);

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const SENIORITY_REASON: Record<Seniority, string> = {
  board: "Board searches",
  cxo: "CXO searches",
  vp_director: "Director and VP roles",
  manager: "Manager roles",
};

type MatchGoals = Pick<NetworkGoals, "markets" | "sectors" | "functions" | "seniority">;

/**
 * Firms for this user, best first. With markets chosen, only firms with an office in at least one
 * of them (unless `requireMarket` is false, for the directory); otherwise every firm. Points for a
 * shared market, sector or function, the user's level and, for CXO and board roles, retained search.
 */
export function matchFirms(goals: MatchGoals, firms: Firm[] = FIRMS, { requireMarket = true } = {}): FirmMatch[] {
  const matches: FirmMatch[] = [];
  for (const firm of firms) {
    const markets = goals.markets.filter((m) => firm.markets.includes(m));
    if (requireMarket && goals.markets.length && !markets.length) continue;
    const sectors = goals.sectors.filter((s) => firm.sectors.includes(s));
    const functions = goals.functions.filter((f) => firm.functions.includes(f));
    const level = goals.seniority && firm.seniority.includes(goals.seniority) ? goals.seniority : null;

    let score = Math.min(markets.length, 2);
    if (sectors.length) score += 3;
    if (functions.length) score += 3;
    if (level) score += 2;
    if ((goals.seniority === "cxo" || goals.seniority === "board") && firm.kind === "retained") score += 1;

    const reasons: string[] = [];
    if (markets.length) reasons.push(`${markets.length > 1 ? "Offices" : "Office"} in ${joinAnd(markets.map(placeName))}`);
    if (sectors.length) {
      const names = sectors.slice(0, 2).map((s, i) => (i === 0 ? SECTOR_LABEL[s] : SECTOR_LABEL[s].toLowerCase()));
      reasons.push(`${joinAnd(names)} ${sectors.length > 1 ? "practices" : "practice"}`);
    }
    if (functions.length) reasons.push(`Covers ${joinAnd(functions.slice(0, 2).map((f) => FUNCTION_LABEL[f].toLowerCase()))} roles`);
    if (level) reasons.push(SENIORITY_REASON[level]);

    matches.push({ firm, score, reasons });
  }
  return matches.sort((a, b) => b.score - a.score || a.firm.name.localeCompare(b.firm.name));
}

export interface FirmFilters {
  market?: Market | null;
  sector?: Sector | null;
  func?: Func | null;
  q?: string | null;
}

/** The directory page's filters: all of them must hold. */
export function filterFirms(firms: Firm[], filters: FirmFilters): Firm[] {
  const q = filters.q?.trim().toLowerCase();
  return firms.filter(
    (f) =>
      (!filters.market || f.markets.includes(filters.market)) &&
      (!filters.sector || f.sectors.includes(filters.sector)) &&
      (!filters.func || f.functions.includes(filters.func)) &&
      (!q || f.name.toLowerCase().includes(q)),
  );
}
