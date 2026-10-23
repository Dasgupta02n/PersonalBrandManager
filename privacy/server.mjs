// The privacy service: finds people's names and embeds text for search, on our own server.
// Reachable only from the app, on the private network. Nothing is logged or stored.
import { createServer } from "node:http";
import { EMBED_DIMS, EMBED_MODEL, NER_MODEL, QUERY_PREFIX, loadModels } from "./models.mjs";
import { findPeople } from "./ner.mjs";

const PORT = Number(process.env.PORT || 8080);
const MAX_BODY = 512 * 1024;
const MAX_TEXTS = 64;
const MAX_CHARS = 20000;

const models = await loadModels();

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const parts = [];
    req.on("data", (part) => {
      size += part.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("too large"), { status: 413 }));
        req.destroy();
      } else parts.push(part);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(parts).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("bad json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function texts(body) {
  const list = body?.texts;
  if (!Array.isArray(list) || list.length > MAX_TEXTS || list.some((t) => typeof t !== "string" || t.length > MAX_CHARS)) {
    throw Object.assign(new Error("texts must be up to 64 strings"), { status: 400 });
  }
  return list;
}

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, ner: NER_MODEL, embed: EMBED_MODEL });
    if (req.method !== "POST") return send(res, 404, { error: "not found" });
    const body = await readJson(req);
    if (req.url === "/ner") {
      const spans = [];
      for (const text of texts(body)) spans.push(await findPeople(text, models.tag));
      return send(res, 200, { spans });
    }
    if (req.url === "/embed") {
      const list = texts(body).map((t) => (body.kind === "query" ? QUERY_PREFIX + t : t));
      const vectors = list.length ? await models.embed(list) : [];
      return send(res, 200, { model: EMBED_MODEL, dims: EMBED_DIMS, vectors });
    }
    return send(res, 404, { error: "not found" });
  } catch (err) {
    // Never log the request body: it holds users' notes.
    console.error("privacy service:", err.status ?? 500, err.message);
    return send(res, err.status ?? 500, { error: err.status ? err.message : "failed" });
  }
}).listen(PORT, () => console.log(`privacy service on :${PORT}`));
