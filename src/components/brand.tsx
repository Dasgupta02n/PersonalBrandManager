import { APP_NAME } from "@/lib/config/app";
import { cx } from "./ui";

/** Ascending bars: steady, compounding visibility. Drawn with paths, so it needs no font. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cx("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <rect x="8" y="17" width="4" height="7" rx="1.5" className="fill-ink-foreground opacity-60" />
      <rect x="14" y="13" width="4" height="11" rx="1.5" className="fill-ink-foreground opacity-80" />
      <rect x="20" y="8" width="4" height="16" rx="1.5" className="fill-brass" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  );
}
