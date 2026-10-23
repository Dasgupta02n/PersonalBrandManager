import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { userDb } from "@/lib/db/client";

/** Tables keyed by user_id; profiles is keyed by id. Row-level security limits every read to the user. */
const USER_TABLES = [
  "subscriptions",
  "confidentiality_rules",
  "pillars",
  "voice_profiles",
  "journal_entries",
  "wins",
  "drafts",
  "opportunities",
  "profile_suggestions",
  "cv_versions",
  "reach_snapshots",
  "scorecards",
  "watch_list",
  "network_goals",
  "network_contacts",
  "network_interactions",
  "network_roles",
  "network_suggestions",
] as const;

/** Everything the user has stored, as one JSON file (DPDP and GDPR access and portability). */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  const userId = user.id;
  const db = userDb(userId);

  const [profile, ...tables] = await Promise.all([
    db.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ...USER_TABLES.map((table) => db.from(table).select("*").eq("user_id", userId)),
  ]);

  const failed = [profile, ...tables].find((result) => result.error);
  if (failed?.error) return NextResponse.json({ error: "Couldn't gather your data. Please try again." }, { status: 500 });

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email: user.email, created_at: user.created_at },
    profile: profile.data,
    ...Object.fromEntries(USER_TABLES.map((table, i) => [table, tables[i].data ?? []])),
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-record-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
