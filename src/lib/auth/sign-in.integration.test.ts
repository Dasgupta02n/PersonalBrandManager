import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Runs against a real database when TEST_DATABASE_URL is set; skipped otherwise.

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;
if (url) {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  process.env.APP_URL = "https://app.example.test";
}
const { requestSignIn, verifyCode, verifyLink } = await import("./sign-in");
const { asService, sql } = await import("@/lib/db/client");

/** Captures what would have been emailed. */
function mailbox() {
  const sent: { to: string; text: string }[] = [];
  const send = vi.fn(async (to: string, content: { text: string }) => {
    sent.push({ to, text: content.text });
  });
  const code = () => sent.at(-1)!.text.match(/code is (\d{6})/)![1];
  const link = () => sent.at(-1)!.text.match(/https:\/\/app\.example\.test\/auth\/confirm\?token=([\w-]+)/)![1];
  return { send, sent, code, link };
}

describe.skipIf(!url)("email sign-in", () => {
  let email = "";
  beforeEach(() => {
    email = `person-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  });

  afterAll(async () => {
    await asService((tx) => tx`delete from users where email like '%@example.test'`);
    await asService((tx) => tx`delete from sign_in_codes where email like '%@example.test'`);
    await sql().end();
  });

  it("creates the account on the first sign-in with the code, and stores only hashes", async () => {
    const box = mailbox();
    expect(await requestSignIn({ email, next: "/wins", ip: "203.0.113.9" }, box.send)).toEqual({ ok: true });
    const code = box.code();

    const [row] = await asService((tx) => tx`select code_hash, link_hash, ip_hash from sign_in_codes where email = ${email}`);
    expect(JSON.stringify(row)).not.toContain(code);
    expect(JSON.stringify(row)).not.toContain(box.link());
    expect(row.ip_hash).not.toContain("203.0.113.9");

    const result = await verifyCode(email, code, "/wins");
    expect(result).toMatchObject({ ok: true, next: "/wins" });
    const [user] = await asService((tx) => tx`select id from users where email = ${email}`);
    expect(result.ok && result.userId).toBe(user.id);

    // The same email can't be used twice: code and link are both spent.
    expect(await verifyCode(email, code, "/wins")).toEqual({ ok: false, reason: "expired" });
    expect(await verifyLink(box.link())).toEqual({ ok: false, reason: "expired" });
  });

  it("signs in with the link, landing where the user was heading, and reuses the account", async () => {
    const first = mailbox();
    await requestSignIn({ email, next: "/today", ip: null }, first.send);
    const firstSignIn = await verifyCode(email, first.code(), "/today");

    await asService((tx) => tx`update sign_in_codes set created_at = created_at - interval '2 minutes' where email = ${email}`);
    const second = mailbox();
    await requestSignIn({ email, next: "/wins/week", ip: null }, second.send);
    const result = await verifyLink(second.link());
    expect(result).toEqual({ ok: true, userId: firstSignIn.ok && firstSignIn.userId, next: "/wins/week" });
  });

  it("locks the code after five wrong tries", async () => {
    const box = mailbox();
    await requestSignIn({ email, next: "/today", ip: null }, box.send);
    const wrong = box.code() === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i++) expect(await verifyCode(email, wrong, "/today")).toEqual({ ok: false, reason: "wrong" });
    expect(await verifyCode(email, wrong, "/today")).toEqual({ ok: false, reason: "locked" });
    expect(await verifyCode(email, box.code(), "/today")).toEqual({ ok: false, reason: "locked" });
    // The link in the same email still works.
    expect((await verifyLink(box.link())).ok).toBe(true);
  });

  it("allows one email a minute and five an hour per address", async () => {
    const box = mailbox();
    expect(await requestSignIn({ email, next: "/today", ip: null }, box.send)).toEqual({ ok: true });
    expect(await requestSignIn({ email, next: "/today", ip: null }, box.send)).toEqual({ ok: false, reason: "too_soon" });
    for (let i = 0; i < 4; i++) {
      await asService((tx) => tx`update sign_in_codes set created_at = created_at - interval '61 seconds' where email = ${email}`);
      expect(await requestSignIn({ email, next: "/today", ip: null }, box.send)).toEqual({ ok: true });
    }
    await asService((tx) => tx`update sign_in_codes set created_at = created_at - interval '61 seconds' where email = ${email}`);
    expect(await requestSignIn({ email, next: "/today", ip: null }, box.send)).toEqual({ ok: false, reason: "too_many" });
    expect(box.sent).toHaveLength(5);
  });

  it("doesn't count an email that failed to send", async () => {
    const failing = vi.fn(async () => {
      throw new Error("SMTP down");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await requestSignIn({ email, next: "/today", ip: null }, failing)).toEqual({ ok: false, reason: "send_failed" });
    const box = mailbox();
    expect(await requestSignIn({ email, next: "/today", ip: null }, box.send)).toEqual({ ok: true });
  });

  it("rejects expired codes and links", async () => {
    const box = mailbox();
    await requestSignIn({ email, next: "/today", ip: null }, box.send);
    await asService((tx) => tx`update sign_in_codes set expires_at = now() - interval '1 second' where email = ${email}`);
    expect(await verifyCode(email, box.code(), "/today")).toEqual({ ok: false, reason: "expired" });
    expect(await verifyLink(box.link())).toEqual({ ok: false, reason: "expired" });
    expect(await verifyLink("not-a-real-token")).toEqual({ ok: false, reason: "expired" });
  });
});
