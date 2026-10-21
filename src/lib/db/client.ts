import "server-only";
import postgres from "postgres";
import { requireEnv } from "@/lib/config/env";
import { Db, type Row } from "./query";

// The app logs in as pbm_app, which has no privileges of its own (db/migrations/0001_schema.sql).
// Every query runs in a short transaction that first switches role:
//   pbm_user     a signed-in user's queries; row-level security limits them to that user's rows
//   pbm_service  trusted server code (sign-in, sessions, usage, account deletion, billing)
// set_config(..., true) lasts only until the transaction ends, so a pooled connection never
// carries one user's identity into the next query.

export type Sql = postgres.Sql;
export type Tx = postgres.TransactionSql;

let pool: Sql | undefined;

/** Values come back as the Supabase client returned them: dates and times as ISO strings. */
const types = {
  date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
  timestamp: {
    to: 1184,
    from: [1114, 1184],
    serialize: (x: unknown) => (x instanceof Date ? x.toISOString() : String(x)),
    parse: (x: string) => new Date(x).toISOString(),
  },
  numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
};

export function sql(): Sql {
  pool ??= postgres(requireEnv("DATABASE_URL"), {
    max: 10,
    idle_timeout: 60,
    connect_timeout: 10,
    onnotice: () => {},
    types,
  });
  return pool;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Runs `fn` as the given user, with row-level security limiting it to their rows. */
export function asUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!UUID.test(userId)) throw new Error("asUser needs a user id");
  return sql().begin(async (tx) => {
    await tx`select set_config('app.user_id', ${userId}, true), set_config('role', 'pbm_user', true)`;
    return fn(tx);
  }) as Promise<T>;
}

/** Runs `fn` as trusted server code. Never pass it ids a user could choose without checking. */
export function asService<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql().begin(async (tx) => {
    await tx`select set_config('role', 'pbm_service', true)`;
    return fn(tx);
  }) as Promise<T>;
}

const runIn = (scope: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>) => (text: string, params: unknown[]) =>
  scope((tx) => tx.unsafe(text, params as postgres.ParameterOrJSON<never>[]) as unknown as Promise<Row[]>);

/** Queries as this user (row-level security applies). Each query is its own transaction. */
export function userDb(userId: string): Db {
  return new Db(runIn((fn) => asUser(userId, fn)));
}

/** Queries as trusted server code, bypassing row-level security. */
export function serviceDb(): Db {
  return new Db(runIn(asService));
}
