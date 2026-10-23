// Finding people's names in text, for the privacy service. Pure functions, tested without models.
//
// The model (BERT trained for named entities) tags word pieces; these helpers turn the tags into
// character spans of whole words, split long notes into chunks the model can read, and run a
// second pass on notes typed all in lowercase ("told ravi the deck is ready").

/** Character spans of words the model tagged as a person, widened to whole words and merged. */
export function wordPieceSpans(text, tokens, threshold = 0.5) {
  let ptr = 0;
  const hits = [];
  for (const t of tokens) {
    const piece = t.word.startsWith("##") ? t.word.slice(2) : t.word;
    if (!piece || piece === "[UNK]") continue;
    const at = text.indexOf(piece, ptr);
    if (at < 0) continue;
    ptr = at + piece.length;
    if (/PER/.test(t.entity ?? t.entity_group ?? "") && t.score >= threshold) hits.push([at, ptr]);
  }
  const isWord = (ch) => /[\p{L}\p{M}'’-]/u.test(ch ?? "");
  const spans = [];
  for (let [s, e] of hits) {
    while (s > 0 && isWord(text[s - 1])) s--;
    while (e < text.length && isWord(text[e])) e++;
    if (/['’]s$/.test(text.slice(s, e))) e -= 2;
    const last = spans[spans.length - 1];
    if (last && s <= last[1] + 1 && /^\s*$/.test(text.slice(last[1], s))) last[1] = Math.max(last[1], e);
    else if (!last || s >= last[1]) spans.push([s, e]);
  }
  return spans;
}

/** True when a note is typed (almost) all in lowercase, so names may be lowercase too. */
export function mostlyLowercase(text) {
  const words = text.match(/\p{L}[\p{L}'’-]*/gu) ?? [];
  if (words.length < 3) return false;
  const capitalised = words.filter((w) => /^\p{Lu}/u.test(w)).length;
  return capitalised / words.length < 0.08;
}

/** Title-cases lowercase words, so the model reads "told ravi" as "told Ravi". */
export function titleCaseLowercase(text) {
  return text.replace(/\b([a-z])([a-z'’-]+)\b/g, (_m, first, rest) => first.toUpperCase() + rest);
}

/** Splits text at line and sentence ends into pieces of at most `max` characters, with offsets. */
export function chunk(text, max = 1200) {
  const pieces = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + max);
    if (end < text.length) {
      const window = text.slice(start, end);
      const cut = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(". "), window.lastIndexOf("; "));
      if (cut > max * 0.4) end = start + cut + 1;
      else {
        const space = window.lastIndexOf(" ");
        if (space > max * 0.4) end = start + space + 1;
      }
    }
    pieces.push({ offset: start, text: text.slice(start, end) });
    start = end;
  }
  return pieces;
}

/** All person spans in a text, using `tag(text)` to run the model on one chunk. */
export async function findPeople(text, tag) {
  const spans = [];
  for (const piece of chunk(text)) {
    for (const [s, e] of wordPieceSpans(piece.text, await tag(piece.text))) spans.push([piece.offset + s, piece.offset + e]);
    if (mostlyLowercase(piece.text)) {
      const titled = titleCaseLowercase(piece.text);
      for (const [s, e] of wordPieceSpans(titled, await tag(titled))) {
        if (/^[a-z]/.test(piece.text.slice(s, e))) spans.push([piece.offset + s, piece.offset + e]);
      }
    }
  }
  return spans.sort((a, b) => a[0] - b[0]);
}
