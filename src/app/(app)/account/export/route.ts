import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
] as const;

/** Everything the user has stored, as one JSON file (DPDP and GDPR access and portability). */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  const userId = data.user.id;

  const [profile, ...tables] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ...USER_TABLES.map((table) => supabase.from(table).select("*").eq("user_id", userId)),
  ]);

  const failed = [profile, ...tables].find((result) => result.error);
  if (failed?.error) return NextResponse.json({ error: "Couldn't gather your data. Please try again." }, { status: 500 });

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email: data.user.email ?? null, created_at: data.user.created_at },
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
