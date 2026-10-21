import { describe, expect, it } from "vitest";
import { safePath } from "./redirect";

describe("sign-in redirects", () => {
  it("keeps paths inside the app and nothing else", () => {
    expect(safePath("/wins")).toBe("/wins");
    expect(safePath("/wins/week?from=email")).toBe("/wins/week?from=email");
    expect(safePath("//evil.example")).toBe("/today");
    expect(safePath("/\\evil.example")).toBe("/today");
    expect(safePath("/\tevil")).toBe("/today");
    expect(safePath("https://evil.example")).toBe("/today");
    expect(safePath("/auth/confirm")).toBe("/today");
    expect(safePath(undefined)).toBe("/today");
  });
});
