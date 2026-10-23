import { env, pipeline } from "@huggingface/transformers";

// The two open models, baked into the image at build time and read from disk at run time. The
// container has no internet access.
//   Names:  dslim/bert-base-NER (MIT), via its ONNX export Xenova/bert-base-NER, 8-bit.
//   Search: BAAI/bge-small-en-v1.5 (MIT), via Xenova/bge-small-en-v1.5, 8-bit, 384 dimensions.

export const NER_MODEL = "Xenova/bert-base-NER";
export const EMBED_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBED_DIMS = 384;
/** BGE's instruction for search queries; passages are embedded as they are. */
export const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

env.cacheDir = process.env.MODEL_DIR || new URL("./models", import.meta.url).pathname;

export async function loadModels({ allowDownload = false } = {}) {
  env.allowRemoteModels = allowDownload;
  const [ner, embed] = await Promise.all([
    pipeline("token-classification", NER_MODEL, { dtype: "q8" }),
    pipeline("feature-extraction", EMBED_MODEL, { dtype: "q8" }),
  ]);
  return {
    tag: (text) => ner(text, { ignore_labels: [] }),
    embed: async (texts) => (await embed(texts, { pooling: "cls", normalize: true })).tolist(),
  };
}
