import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Search } from "lucide-react";
import { IconSubmitButton } from "@/components/client";
import { NetworkNav } from "@/components/network-nav";
import { Label, PageHeader, Select, buttonClass } from "@/components/ui";
import { loadGoals } from "@/lib/data/network";
import { requireUser } from "@/lib/data/session";
import { FIRMS, filterFirms, matchFirms } from "@/lib/network/firms";
import { linkedinPeopleSearch } from "@/lib/network/links";
import {
  FIRM_KIND_LABEL,
  FUNCTION_LABEL,
  FUNCTIONS,
  MARKET_LABEL,
  MARKETS,
  SECTOR_LABEL,
  SECTORS,
  type Func,
  type Market,
  type Sector,
} from "@/lib/network/taxonomy";
import { addFirm } from "../actions";

export const metadata: Metadata = { title: "Search firms" };

const oneOf = <T extends string>(list: readonly T[], value: unknown): T | null =>
  typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : null;

export default async function FirmsPage({ searchParams }: PageProps<"/network/firms">) {
  const { db, user } = await requireUser();
  const params = await searchParams;
  const filters = {
    market: oneOf<Market>(MARKETS, params.market),
    sector: oneOf<Sector>(SECTORS, params.sector),
    func: oneOf<Func>(FUNCTIONS, params.func),
    q: typeof params.q === "string" ? params.q.slice(0, 80) : null,
  };

  const [goals, contacts] = await Promise.all([
    loadGoals(db, user.id),
    db.from("network_contacts").select("id, firm_id").eq("user_id", user.id).not("firm_id", "is", null),
  ]);
  const added = new Map((contacts.data ?? []).map((c) => [c.firm_id as string, c.id as string]));
  const filtered = filterFirms(FIRMS, filters);
  // With answers, best fit first and the reasons shown; without, A to Z.
  const rows = goals
    ? matchFirms(goals, filtered, { requireMarket: false })
    : filtered.map((firm) => ({ firm, reasons: [] as string[], score: 0 })).sort((a, b) => a.firm.name.localeCompare(b.firm.name));
  const sectorForSearch = filters.sector ?? goals?.sectors[0] ?? null;
  const active = Boolean(filters.market || filters.sector || filters.func || filters.q);

  return (
    <>
      <NetworkNav active="/network/firms" />
      <PageHeader
        title="Search firms"
        description={`${FIRMS.length} executive search and senior recruitment firms with offices in India, the UAE, the UK, Singapore or the US. Firm details only, each checked on the firm's own website.`}
      />

      <form method="get" className="grid gap-3 rounded-xl bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <Label htmlFor="market">Office in</Label>
          <Select id="market" name="market" defaultValue={filters.market ?? ""}>
            <option value="">Any country</option>
            {MARKETS.map((m) => (
              <option key={m} value={m}>
                {MARKET_LABEL[m]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sector">Sector</Label>
          <Select id="sector" name="sector" defaultValue={filters.sector ?? ""}>
            <option value="">Any sector</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {SECTOR_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="func">Function</Label>
          <Select id="func" name="func" defaultValue={filters.func ?? ""}>
            <option value="">Any function</option>
            {FUNCTIONS.map((f) => (
              <option key={f} value={f}>
                {FUNCTION_LABEL[f]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="q">Name</Label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search by name"
            className="mt-1.5 block min-h-12 w-full rounded-lg border border-border-strong bg-field px-3.5 py-3 text-base placeholder:text-subtle focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" className={buttonClass("primary", undefined, "sm")}>
            Show firms
          </button>
          {active && (
            <Link href="/network/firms" className="text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground">
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="-mb-4 text-sm text-muted" aria-live="polite">
        {rows.length} {rows.length === 1 ? "firm" : "firms"}
        {goals ? ", best fit for your answers first" : ""}
      </p>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {rows.map(({ firm, reasons }) => {
          const contactId = added.get(firm.id);
          return (
            <li key={firm.id} className="flex items-start gap-2 py-3.5">
              <div className="min-w-0 flex-1">
                <a href={firm.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[15px] font-semibold hover:underline">
                  {firm.name}
                  <ArrowUpRight aria-hidden className="size-3.5 text-subtle" />
                </a>
                <p className="text-[13px] text-subtle">
                  {FIRM_KIND_LABEL[firm.kind]} · {firm.markets.map((m) => MARKET_LABEL[m]).join(", ")}
                </p>
                {reasons.length > 0 && <p className="mt-1 text-sm leading-snug text-muted">{reasons.join(" · ")}</p>}
              </div>
              <a
                href={linkedinPeopleSearch(`${firm.name} ${sectorForSearch ? SECTOR_LABEL[sectorForSearch] : ""}`)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Find consultants at ${firm.name} on LinkedIn (opens LinkedIn)`}
                title="Find consultants on LinkedIn"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
              >
                <Search aria-hidden className="size-[18px]" />
              </a>
              {contactId ? (
                <Link href={`/network/contacts/${contactId}`} title="In your network" className="flex size-11 shrink-0 items-center justify-center text-success">
                  <Check aria-hidden className="size-[18px]" />
                  <span className="sr-only">In your network</span>
                </Link>
              ) : (
                <form action={addFirm}>
                  <input type="hidden" name="firmId" value={firm.id} />
                  <IconSubmitButton
                    label={`Add ${firm.name} to your network`}
                    icon="plus"
                    className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                  />
                </form>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] leading-snug text-subtle">
        We list firms, never their people. The search icon opens LinkedIn in your own browser so you can find the consultant who covers your area.
        Spotted something out of date? Write to hello@c7xai.in.
      </p>
    </>
  );
}
