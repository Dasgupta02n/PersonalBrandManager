/** LinkedIn's maximum post length. */
export const LINKEDIN_MAX_CHARS = 3000;

/**
 * Roughly where LinkedIn folds a post behind "…see more": about three lines or 210
 * characters, whichever comes first. The exact point varies by device and app version,
 * so the preview presents it as approximate.
 */
export function seeMoreCutoff(text: string, maxChars = 210, maxLines = 3): number {
  let lines = 0;
  for (let i = 0; i < text.length && i < maxChars; i++) {
    if (text[i] === "\n") {
      lines += 1;
      if (lines >= maxLines) return i;
    }
  }
  if (text.length <= maxChars) return text.length;
  // Fold at the last word boundary before the limit.
  const space = text.lastIndexOf(" ", maxChars);
  return space > maxChars * 0.6 ? space : maxChars;
}

/** The text exactly as it will be copied: body, then hashtags on their own line. */
export function postWithHashtags(body: string, hashtags: string[]): string {
  return hashtags.length ? `${body.trim()}\n\n${hashtags.join(" ")}` : body.trim();
}
