// Run once while building the image: fetches both models into ./models.
import { loadModels } from "./models.mjs";

const models = await loadModels({ allowDownload: true });
const spans = await models.tag("Priya Raman met the team.");
const [vector] = await models.embed(["A test sentence."]);
if (!spans.length || vector.length !== 384) throw new Error("model check failed");
console.log("models ready");
