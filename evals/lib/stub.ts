import { z } from "zod";

// Dry runs: schema-shaped stand-in answers, so the whole harness can be exercised without a
// model or any cost. Never mistake a dry run for a result; its report says so at the top.

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: unknown[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
};

function fake(schema: JsonSchema, key = ""): unknown {
  const options = schema.anyOf ?? schema.oneOf;
  if (options) return fake(options.find((o) => o.type !== "null") ?? options[0], key);
  if (schema.enum) return schema.enum[0];
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type;
  switch (type) {
    case "object":
      return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([k, v]) => [k, fake(v, k)]));
    case "array":
      return [0, 1, 2].map(() => fake(schema.items ?? {}, key));
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 0;
    case "string":
      return `Dry-run ${key || "text"}: a stand-in sentence of ordinary length for checking the harness end to end.`;
    default:
      return null;
  }
}

export function stubFor<S extends z.ZodType>(schema: S): z.infer<S> {
  return schema.parse(fake(z.toJSONSchema(schema) as JsonSchema));
}
