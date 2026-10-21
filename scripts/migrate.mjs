// Applies db/migrations/*.sql in order, once each, then makes sure the app's login role exists
// with the password from the environment. Runs as the database superuser, from the one-off
// "migrate" service in deploy/app.compose.yml (or locally: `npm run db:migrate`).
//
//   DATABASE_ADMIN_URL  superuser connection, used only here
//   PBM_APP_PASSWORD    password for the app's login role (pbm_app)

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "db", "migrations");

const adminUrl = process.env.DATABASE_ADMIN_URL;
const appPassword = process.env.PBM_APP_PASSWORD;
if (!adminUrl) throw new Error("Set DATABASE_ADMIN_URL");
if (!appPassword || appPassword.length < 16) throw new Error("Set PBM_APP_PASSWORD (16 characters or more)");

const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });

try {
  await sql`create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select version from schema_migrations`).map((r) => r.version));
  const files = readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();

  for (const file of files) {
    if (done.has(file)) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(dir, file), "utf8"));
      await tx`insert into schema_migrations (version) values (${file})`;
    });
    console.log(`applied ${file}`);
  }

  // The app's login: no privileges of its own, only membership of the two roles it switches to.
  const quoted = `'${appPassword.replaceAll("'", "''")}'`;
  const exists = (await sql`select 1 from pg_roles where rolname = 'pbm_app'`).length > 0;
  await sql.unsafe(`${exists ? "alter" : "create"} role pbm_app with login noinherit password ${quoted}`);
  await sql`grant pbm_user, pbm_service to pbm_app`;
  console.log(`database ready (${files.length} migrations)`);
} finally {
  await sql.end();
}
