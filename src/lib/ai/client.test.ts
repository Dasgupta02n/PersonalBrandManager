import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

process.env.DATABASE_URL = "postgres://pbm_app:secret@db:5432/pbm";
process.env.AUTH_SECRET = "a".repeat(32);
process.env.OPENROUTER_API_KEY = "sk-or-test";

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

const { AiOutputError, AiRefusalError, runStructured } = await import("./client");

const schema = z.object({ answer: z.string() });

function openRouterResponse(overrides: Record<string, unknown> = {}) {
  const body = {
    id: "gen-1",
    type: "message",
    role: "assistant",
    model: "anthropic/claude-opus-5.5",
    provider: "Google",
    content: [{ type: "text", text: JSON.stringify({ answer: "ok" }) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    stop_details: null,
    usage: { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 0, cost: 0.00108 },
    ...overrides,
  };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

function run(onUsage = vi.fn()) {
  return runStructured({ task: "draft_post", system: "Rules", prompt: "Facts", schema, onUsage });
}

describe("runStructured", () => {
  beforeEach(() => fetchMock.mockReset());

  it("sends a pinned-model request to OpenRouter with the hosting restrictions", async () => {
    fetchMock.mockResolvedValueOnce(openRouterResponse());
    await run();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://openrouter.ai/api/v1/messages");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer sk-or-test");
    expect(headers.get("x-api-key")).toBeNull();

    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("anthropic/claude-opus-5.5");
    expect(body.provider).toEqual({ zdr: true, require_parameters: true });
    expect(body.output_config.effort).toBe("high");
    expect(body.output_config.format.type).toBe("json_schema");
    expect(body.fallbacks).toBeUndefined();
    expect(body.models).toBeUndefined();
  });

  it("returns parsed output and records model, host and cost", async () => {
    fetchMock.mockResolvedValueOnce(openRouterResponse());
    const onUsage = vi.fn();
    await expect(run(onUsage)).resolves.toEqual({ answer: "ok" });
    expect(onUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        task: "draft_post",
        model: "anthropic/claude-opus-5.5",
        provider: "Google",
        inputTokens: 120,
        outputTokens: 30,
        costUsd: 0.00108,
        stopReason: "end_turn",
      }),
    );
  });

  it("raises a refusal error with its category", async () => {
    fetchMock.mockResolvedValueOnce(
      openRouterResponse({ content: [], stop_reason: "refusal", stop_details: { type: "refusal", category: "cyber" } }),
    );
    await expect(run()).rejects.toEqual(new AiRefusalError("cyber"));
  });

  it("raises an output error when the response is cut off", async () => {
    fetchMock.mockResolvedValueOnce(
      openRouterResponse({ content: [{ type: "text", text: '{"answ' }], stop_reason: "max_tokens" }),
    );
    await expect(run()).rejects.toEqual(new AiOutputError("The AI response was cut off before it finished."));
  });

  it("raises an output error when the response does not match the schema", async () => {
    fetchMock.mockResolvedValueOnce(openRouterResponse({ content: [{ type: "text", text: '{"other":1}' }] }));
    await expect(run()).rejects.toEqual(new AiOutputError("The AI response did not match the expected format."));
  });
});
