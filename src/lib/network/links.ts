// Links the user opens in their own browser. Winwall never requests these pages itself: a search
// on LinkedIn runs only when the user clicks, signed in as themselves.

/** LinkedIn's people search for these words, e.g. "Chief Risk Officer Emirates NBD". */
export function linkedinPeopleSearch(keywords: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords.replace(/\s+/g, " ").trim())}`;
}

/** A pasted link, only if it is a plain web address; anything else (javascript:, data:) is dropped. */
export function safeWebUrl(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** An email draft the user's own mail app opens, with the subject and body filled in. */
export function mailtoLink(to: string | null, subject: string | null, body: string): string {
  const params = [subject ? `subject=${encodeURIComponent(subject)}` : null, `body=${encodeURIComponent(body)}`].filter(Boolean).join("&");
  return `mailto:${to ? encodeURIComponent(to).replace(/%40/g, "@") : ""}?${params}`;
}
