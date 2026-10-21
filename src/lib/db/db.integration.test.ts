import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Runs against a real database when TEST_DATABASE_URL is set (the pbm_app login on a database
// migrated with `npm run db:migrate`); skipped otherwise. Creates its own users and deletes them.

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;
if (url) {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret";
}
const { asService, serviceDb, sql, userDb } = await import("./client");

describe.skipIf(!url)("database roles and row-level security", () => {

  let alice = "";
  let bob = "";

  beforeAll(async () => {
    const stamp = Date.now();
    const created = await asService(
      (tx) => tx`insert into users (email) values (${`alice-${stamp}@example.test`}), (${`bob-${stamp}@example.test`}) returning id`,
    );
    [alice, bob] = created.map((r) => r.id as string);
  });

  afterAll(async () => {
    await serviceDb().from("users").delete().in("id", [alice, bob]);
    await sql().end();
  });

  it("gives a new account a profile, rules and the beta plan", async () => {
    const db = userDb(alice);
    expect((await db.from("profiles").select("id, timezone").maybeSingle()).data).toEqual({ id: alice, timezone: "UTC" });
    expect((await db.from("confidentiality_rules").select("user_id").maybeSingle()).data).toEqual({ user_id: alice });
    expect((await db.from("subscriptions").select("plan").maybeSingle()).data).toEqual({ plan: "beta" });
  });

  it("returns values in the shapes the app expects", async () => {
    const db = userDb(alice);
    const inserted = await db
      .from("journal_entries")
      .insert({ user_id: alice, entry_date: "2026-10-21", raw_text: "Closed the audit" })
      .select("id, entry_date, created_at")
      .single();
    expect(inserted.error).toBeNull();
    expect(inserted.data.entry_date).toBe("2026-10-21");
    expect(inserted.data.created_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);

    const win = await db
      .from("wins")
      .insert({
        user_id: alice,
        journal_entry_id: inserted.data.id,
        occurred_on: "2026-10-21",
        summary: "Closed the audit with no findings",
        skills: ["audit", "risk"],
        kind: "result",
      })
      .select("id, skills, confidential")
      .single();
    expect(win.error).toBeNull();
    expect(win.data.skills).toEqual(["audit", "risk"]);
    expect(win.data.confidential).toBe(false);

    const draft = await db
      .from("drafts")
      .insert({ user_id: alice, kind: "post", status: "ready", body: "Hello", source_win_ids: [win.data.id], guardrails: { passed: true, issues: [] } })
      .select("id, source_win_ids, guardrails")
      .single();
    expect(draft.error).toBeNull();
    expect(draft.data.source_win_ids).toEqual([win.data.id]);
    expect(draft.data.guardrails).toEqual({ passed: true, issues: [] });

    const posted = await db
      .from("drafts")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", draft.data.id)
      .select("posted_at")
      .maybeSingle();
    expect(posted.data.posted_at).toMatch(/Z$/);

    const count = await db.from("drafts").select("id", { count: "exact", head: true }).eq("status", "posted").gte("posted_at", "2026-01-01T00:00:00Z");
    expect(count.count).toBe(1);

    const filtered = await db.from("wins").select("id").in("id", [win.data.id]).not("journal_entry_id", "is", null);
    expect(filtered.data).toEqual([{ id: win.data.id }]);
  });

  it("upserts the style notebook with JSON values", async () => {
    const db = userDb(alice);
    expect((await db.from("voice_profiles").upsert({ user_id: alice, notes: [{ key: "a", text: "Short", source: "you" }] })).error).toBeNull();
    expect((await db.from("voice_profiles").upsert({ user_id: alice, muted: ["b"], edit_stats: { pairs: 1 } })).error).toBeNull();
    const row = await db.from("voice_profiles").select("notes, muted, edit_stats").maybeSingle();
    expect(row.data).toEqual({ notes: [{ key: "a", text: "Short", source: "you" }], muted: ["b"], edit_stats: { pairs: 1 } });
  });

  it("keeps each user to their own rows", async () => {
    const asBob = userDb(bob);
    expect((await asBob.from("journal_entries").select("id")).data).toEqual([]);
    expect((await asBob.from("profiles").select("id")).data).toEqual([{ id: bob }]);

    // Writing a row for someone else is refused, and so is changing their rows.
    const forged = await asBob.from("journal_entries").insert({ user_id: alice, entry_date: "2026-10-21", raw_text: "x" });
    expect(forged.error?.code).toBe("42501");
    await asBob.from("wins").update({ summary: "changed" }).eq("user_id", alice);
    const alicesWin = await userDb(alice).from("wins").select("summary").maybeSingle();
    expect(alicesWin.data.summary).toBe("Closed the audit with no findings");
  });

  it("hides server-only tables from users and lets users only read their plan", async () => {
    const asAlice = userDb(alice);
    expect((await asAlice.from("users").select("id")).error?.code).toBe("42501");
    expect((await asAlice.from("sessions").select("token_hash")).error?.code).toBe("42501");
    expect((await asAlice.from("ai_usage").select("id")).error?.code).toBe("42501");
    expect((await asAlice.from("subscriptions").update({ plan: "member" }).eq("user_id", alice)).error?.code).toBe("42501");
  });

  it("gives the bare login no access at all", async () => {
    await expect(sql()`select id from profiles`).rejects.toMatchObject({ code: "42501" });
  });

  it("records usage as the service and keeps the cost as a number", async () => {
    const service = serviceDb();
    expect((await service.from("ai_usage").insert({ user_id: alice, task: "extract_wins", model: "m", cost_usd: 0.0123 })).error).toBeNull();
    const rows = await service.from("ai_usage").select("cost_usd").eq("user_id", alice);
    expect(rows.data).toEqual([{ cost_usd: 0.0123 }]);
  });

  it("deletes everything with the account and keeps usage costs without the id", async () => {
    const { data: temp } = await asService((tx) => tx`insert into users (email) values (${`temp-${Date.now()}@example.test`}) returning id`).then(
      (rows) => ({ data: rows[0].id as string }),
    );
    await userDb(temp).from("journal_entries").insert({ user_id: temp, entry_date: "2026-10-21", raw_text: "x" });
    await serviceDb().from("ai_usage").insert({ user_id: temp, task: "t", model: "m", cost_usd: 1 });
    expect((await serviceDb().from("users").delete().eq("id", temp)).error).toBeNull();
    const left = await asService((tx) => tx`select
      (select count(*)::int from journal_entries where user_id = ${temp}) as entries,
      (select count(*)::int from profiles where id = ${temp}) as profiles,
      (select count(*)::int from ai_usage where user_id is null and task = 't') as orphaned_usage`);
    expect(left[0]).toMatchObject({ entries: 0, profiles: 0 });
    expect(left[0].orphaned_usage).toBeGreaterThan(0);
  });
});
