import { APP_NAME } from "@/lib/config/app";
import { cx } from "./ui";

/**
 * A seal: a ring and a brass centre inside a softly rounded square. Symmetric and calm,
 * a mark of something kept and verified rather than a growth chart or a megaphone.
 * Drawn with shapes only, so it stays crisp at favicon sizes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cx("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="7" className="fill-ink" />
      <circle cx="16" cy="16" r="8.25" fill="none" strokeWidth="2.5" className="stroke-ink-foreground" />
      <circle cx="16" cy="16" r="3.25" className="fill-seal" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <LogoMark className="size-7" />
      <span className="font-display text-[19px] font-medium">{APP_NAME}</span>
    </span>
  );
}
