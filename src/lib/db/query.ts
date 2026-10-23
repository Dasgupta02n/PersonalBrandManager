// A small query builder with the shape of the Supabase client we used before:
// `db.from("wins").select("id, summary").eq("user_id", id).order("occurred_on").limit(20)`.
// It only builds SQL with numbered parameters; client.ts runs it inside a transaction that has
// already switched to the right role, so row-level security still decides what a user can see.
// Like the Supabase client, awaiting a query never throws for database errors: it resolves to
// `{ data, error, count }`. Mistakes in the code itself (a bad column name) do throw.

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are untyped, as they were before. */

/** A row to write. */
export type Row = Record<string, any>;
/** A row read back: loosely typed, as the Supabase client's rows were, so pages can narrow it. */
export type Found = any;
export type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

export interface DbError {
  message: string;
  code?: string;
}

/** Like the Supabase client's result: data on success, error (and null data) on failure. */
export type DbResult<T = Found[]> = { data: T; error: null; count: number | null } | { data: null; error: DbError; count: null };

/** Primary keys used by upsert (Supabase used the primary key by default too). */
const CONFLICT_KEYS: Record<string, string[]> = {
  profiles: ["id"],
  voice_profiles: ["user_id"],
  confidentiality_rules: ["user_id"],
  subscriptions: ["user_id"],
  network_goals: ["user_id"],
  network_suggestions: ["user_id"],
};

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function ident(name: string): string {
  if (!IDENTIFIER.test(name)) throw new Error(`Not a valid column or table name: ${name}`);
  return `"${name}"`;
}

function columnList(columns: string): string {
  const parts = columns.split(",").map((c) => c.trim()).filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "*")) return "*";
  return parts.map(ident).join(", ");
}

/** Drops undefined values, as JSON did when the Supabase client sent them. */
function defined(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

type Action = "select" | "insert" | "upsert" | "update" | "delete";
type Filter = { column: string; op: "=" | ">=" | "<=" | ">" | "<" | "in" | "is null" | "is not null"; value?: unknown };

/** `T` is what `data` holds: rows, one row, or null for writes that return nothing. */
export class Query<T = Found[]> implements PromiseLike<DbResult<T>> {
  private action: Action = "select";
  private columns = "*";
  private returning: string | null = null;
  private countOnly = false;
  private rows: Row[] = [];
  private patch: Row = {};
  private filters: Filter[] = [];
  private orders: string[] = [];
  private limitTo: number | null = null;
  private expect: "many" | "single" | "maybe" = "many";

  constructor(
    private readonly run: Runner,
    private readonly table: string,
  ) {
    ident(table);
  }

  /**
   * As the first call: read these columns. After insert, update, upsert or delete: return them.
   * `{ count: "exact", head: true }` returns only the number of matching rows, in `count`.
   */
  select(columns: string, options: { count: "exact"; head: true }): Query<null>;
  select(columns?: string): Query<Found[]>;
  select(columns = "*", options?: { count?: "exact"; head?: boolean }): Query<Found[]> | Query<null> {
    if (this.action === "select") {
      this.columns = columnList(columns);
      if (options?.count) {
        if (!options.head) throw new Error("count is supported only with head: true");
        this.countOnly = true;
      }
    } else {
      this.returning = columnList(columns);
    }
    return this as unknown as Query<Found[]>;
  }

  insert(values: Row | Row[]): Query<null> {
    this.action = "insert";
    this.rows = (Array.isArray(values) ? values : [values]).map(defined);
    return this as unknown as Query<null>;
  }

  /** Insert, or update the given columns when the row's primary key already exists. */
  upsert(values: Row | Row[]): Query<null> {
    this.insert(values);
    this.action = "upsert";
    return this as unknown as Query<null>;
  }

  update(values: Row): Query<null> {
    this.action = "update";
    this.patch = defined(values);
    return this as unknown as Query<null>;
  }

  delete(): Query<null> {
    this.action = "delete";
    return this as unknown as Query<null>;
  }

  eq(column: string, value: unknown): this {
    this.filters.push(value === null ? { column, op: "is null" } : { column, op: "=", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: ">=", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: "<=", value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, op: ">", value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, op: "<", value });
    return this;
  }

  in(column: string, values: readonly unknown[]): this {
    this.filters.push({ column, op: "in", value: [...values] });
    return this;
  }

  /** Only `.not(column, "is", null)` is supported. */
  not(column: string, operator: "is", value: null): this {
    if (operator !== "is" || value !== null) throw new Error("Only not(column, 'is', null) is supported");
    this.filters.push({ column, op: "is not null" });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push(`${ident(column)} ${options?.ascending === false ? "desc" : "asc"}`);
    return this;
  }

  limit(count: number): this {
    if (!Number.isInteger(count) || count < 0) throw new Error(`Invalid limit: ${count}`);
    this.limitTo = count;
    return this;
  }

  /** Exactly one row, or an error. */
  single(): Query<Found> {
    this.expect = "single";
    return this as unknown as Query<Found>;
  }

  /** One row or null; more than one is an error. */
  maybeSingle(): Query<Found | null> {
    this.expect = "maybe";
    return this as unknown as Query<Found | null>;
  }

  /** The SQL text and parameters this query will run. */
  toSql(): { text: string; params: unknown[] } {
    const params: unknown[] = [];
    const param = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };
    const table = ident(this.table);

    const where = () => {
      if (this.filters.length === 0) return "";
      const parts = this.filters.map((f) => {
        const col = ident(f.column);
        if (f.op === "is null" || f.op === "is not null") return `${col} ${f.op}`;
        if (f.op === "in") return `${col} = any(${param(f.value)})`;
        return `${col} ${f.op} ${param(f.value)}`;
      });
      return ` where ${parts.join(" and ")}`;
    };
    const returning = this.returning ? ` returning ${this.returning}` : "";

    switch (this.action) {
      case "select": {
        if (this.countOnly) return { text: `select count(*)::int as count from ${table}${where()}`, params };
        const order = this.orders.length ? ` order by ${this.orders.join(", ")}` : "";
        const limit = this.limitTo !== null ? ` limit ${this.limitTo}` : "";
        return { text: `select ${this.columns} from ${table}${where()}${order}${limit}`, params };
      }
      case "insert":
      case "upsert": {
        if (this.rows.length === 0) throw new Error(`Nothing to insert into ${this.table}`);
        const columns = [...new Set(this.rows.flatMap((r) => Object.keys(r)))];
        const values = this.rows
          .map((r) => `(${columns.map((c) => (c in r ? param(r[c]) : "default")).join(", ")})`)
          .join(", ");
        let text = `insert into ${table} (${columns.map(ident).join(", ")}) values ${values}`;
        if (this.action === "upsert") {
          const keys = CONFLICT_KEYS[this.table];
          if (!keys) throw new Error(`No upsert key known for ${this.table}`);
          const updates = columns.filter((c) => !keys.includes(c));
          text += ` on conflict (${keys.map(ident).join(", ")}) do ${
            updates.length ? `update set ${updates.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(", ")}` : "nothing"
          }`;
        }
        return { text: text + returning, params };
      }
      case "update": {
        const columns = Object.keys(this.patch);
        if (columns.length === 0) throw new Error(`Nothing to update in ${this.table}`);
        const set = columns.map((c) => `${ident(c)} = ${param(this.patch[c])}`).join(", ");
        return { text: `update ${table} set ${set}${where()}${returning}`, params };
      }
      case "delete":
        return { text: `delete from ${table}${where()}${returning}`, params };
    }
  }

  private async execute(): Promise<DbResult<T>> {
    const { text, params } = this.toSql();
    let rows: Row[];
    try {
      rows = await this.run(text, params);
    } catch (err) {
      const e = err as { message?: string; code?: string };
      return { data: null, error: { message: e.message ?? String(err), code: e.code }, count: null };
    }

    if (this.countOnly) return { data: null as T, error: null, count: Number(rows[0]?.count ?? 0) };
    if (this.action !== "select" && !this.returning) return { data: null as T, error: null, count: null };
    if (this.expect === "many") return { data: [...rows] as T, error: null, count: null };
    if (rows.length > 1 || (rows.length === 0 && this.expect === "single")) {
      return {
        data: null,
        error: { message: `Expected ${this.expect === "single" ? "one row" : "at most one row"}, got ${rows.length}`, code: "PGRST116" },
        count: null,
      };
    }
    return { data: (rows[0] ?? null) as T, error: null, count: null };
  }

  then<R1 = DbResult<T>, R2 = never>(
    onfulfilled?: ((value: DbResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/** Database access in one scope (a signed-in user, or trusted server code). */
export class Db {
  constructor(private readonly run: Runner) {}

  from(table: string): Query<Found[]> {
    return new Query<Found[]>(this.run, table);
  }
}
