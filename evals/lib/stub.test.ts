import { describe, expect, it } from "vitest";
import * as schemas from "@/lib/ai/schemas";
import { stubFor } from "./stub";

describe("stubFor", () => {
  it("produces a valid stand-in answer for every product schema", () => {
    for (const [name, schema] of Object.entries(schemas)) {
      if (!name.endsWith("Schema")) continue;
      expect(() => stubFor(schema as never), name).not.toThrow();
    }
  });
});
