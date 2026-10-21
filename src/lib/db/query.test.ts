import { describe, expect, it, vi } from "vitest";
import { Db, type Row, type Runner } from "./query";

function fakeDb(rows: Row[] = []) {
  const run = vi.fn<Runner>(async () => rows);
  return { db: new Db(run), run };
}

describe("query builder", () => {
  it("builds a filtered, ordered, limited select", () => {
    const { db } = fakeDb();
    const q = db
      .from("wins")
      .select("id, summary")
      .eq("user_id", "u1")
      .gte("occurred_on", "2026-10-01")
      .in("kind", ["result", "lesson"])
      .not("metric", "is", null)
      .order("occurred_on", { ascending: false })
      .order("created_at")
      .limit(20);
    expect(q.toSql()).toEqual({
      text:
        'select "id", "summary" from "wins" where "user_id" = $1 and "occurred_on" >= $2 and "kind" = any($3) ' +
        'and "metric" is not null order by "occurred_on" desc, "created_at" asc limit 20',
      params: ["u1", "2026-10-01", ["result", "lesson"]],
    });
  });

  it("counts without returning rows", async () => {
    const { db, run } = fakeDb([{ count: 4 }]);
    const result = await db.from("drafts").select("id", { count: "exact", head: true }).eq("status", "ready");
    expect(run.mock.calls[0][0]).toBe('select count(*)::int as count from "drafts" where "status" = $1');
    expect(result).toEqual({ data: null, error: null, count: 4 });
  });

  it("inserts several rows, using the default for missing columns, and returns columns", () => {
    const { db } = fakeDb();
    const q = db
      .from("pillars")
      .insert([{ user_id: "u1", name: "A", position: 0 }, { user_id: "u1", name: "B", description: undefined }])
      .select("id");
    expect(q.toSql()).toEqual({
      text: 'insert into "pillars" ("user_id", "name", "position") values ($1, $2, $3), ($4, $5, default) returning "id"',
      params: ["u1", "A", 0, "u1", "B"],
    });
  });

  it("upserts on the primary key, updating only the columns given", () => {
    const { db } = fakeDb();
    expect(db.from("voice_profiles").upsert({ user_id: "u1", notes: [{ key: "a" }] }).toSql()).toEqual({
      text: 'insert into "voice_profiles" ("user_id", "notes") values ($1, $2) on conflict ("user_id") do update set "notes" = excluded."notes"',
      params: ["u1", [{ key: "a" }]],
    });
  });

  it("updates and deletes with filters, treating eq(null) as is null", () => {
    const { db } = fakeDb();
    expect(db.from("drafts").update({ status: "discarded", hook: undefined }).eq("id", "d1").eq("parent_id", null).toSql()).toEqual({
      text: 'update "drafts" set "status" = $1 where "id" = $2 and "parent_id" is null',
      params: ["discarded", "d1"],
    });
    expect(db.from("wins").delete().eq("id", "w1").toSql()).toEqual({ text: 'delete from "wins" where "id" = $1', params: ["w1"] });
  });

  it("returns null data for writes without select", async () => {
    const { db } = fakeDb([{ id: "x" }]);
    expect(await db.from("wins").delete().eq("id", "w1")).toEqual({ data: null, error: null, count: null });
  });

  it("applies single and maybeSingle", async () => {
    expect((await fakeDb([{ id: 1 }]).db.from("wins").select("id").single()).data).toEqual({ id: 1 });
    expect((await fakeDb([]).db.from("wins").select("id").maybeSingle()).data).toBeNull();
    expect((await fakeDb([]).db.from("wins").select("id").single()).error?.code).toBe("PGRST116");
    expect((await fakeDb([{ id: 1 }, { id: 2 }]).db.from("wins").select("id").maybeSingle()).error?.code).toBe("PGRST116");
  });

  it("returns database errors instead of throwing", async () => {
    const run = vi.fn(async () => {
      throw Object.assign(new Error("permission denied for table users"), { code: "42501" });
    });
    const result = await new Db(run).from("users").select("id");
    expect(result).toEqual({ data: null, error: { message: "permission denied for table users", code: "42501" }, count: null });
  });

  it("throws on names that aren't plain identifiers", () => {
    const { db } = fakeDb();
    expect(() => db.from("wins; drop table wins")).toThrow();
    expect(() => db.from("wins").select('id, "summary"').toSql()).toThrow();
    expect(() => db.from("wins").select("id").eq("user_id) or (1=1", "x").toSql()).toThrow();
  });
});
