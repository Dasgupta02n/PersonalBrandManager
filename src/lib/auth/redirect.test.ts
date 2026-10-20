import { describe, expect, it } from "vitest";
import { landingFrom, safePath } from "./redirect";

describe("sign-in redirects", () => {
  it("keeps paths inside the app and nothing else", () => {
    expect(safePath("/wins")).toBe("/wins");
    expect(safePath("//evil.example")).toBe("/today");
    expect(safePath("https://evil.example")).toBe("/today");
    expect(safePath("/auth/confirm")).toBe("/today");
    expect(safePath(undefined)).toBe("/today");
  });

  it("lands on the page carried inside the email's redirect address, only for this site", () => {
    const origin = "https://c7xai.in";
    expect(landingFrom("https://c7xai.in/auth/callback?next=/wins/week", origin)).toBe("/wins/week");
    expect(landingFrom("https://c7xai.in/auth/callback?next=%2Fdrafts", origin)).toBe("/drafts");
    expect(landingFrom("https://evil.example/auth/callback?next=/wins", origin)).toBe("/today");
    expect(landingFrom("https://c7xai.in/auth/callback?next=//evil.example", origin)).toBe("/today");
    expect(landingFrom(null, origin)).toBe("/today");
    expect(landingFrom("not a url", origin)).toBe("/today");
  });
});
