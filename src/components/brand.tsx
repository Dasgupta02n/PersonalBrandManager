import { APP_NAME } from "@/lib/config/app";
import { cx } from "./ui";

/**
 * The mark: a wall of four tiles on a night square, one of them gold. A wall of your work, with
 * a win on it. Drawn with shapes only and fixed colours, so it reads the same on paper, on night
 * and at favicon sizes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cx("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill="#14141f" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#ffffff" strokeOpacity="0.14" />
      <rect x="7" y="7" width="8" height="8" rx="2.25" fill="#ffffff" fillOpacity="0.92" />
      <rect x="17" y="7" width="8" height="8" rx="2.25" fill="#f2b544" />
      <rect x="7" y="17" width="8" height="8" rx="2.25" fill="#ffffff" fillOpacity="0.5" />
      <rect x="17" y="17" width="8" height="8" rx="2.25" fill="#ffffff" fillOpacity="0.26" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("flex shrink-0 items-center gap-2.5 whitespace-nowrap", className)}>
      <LogoMark className="size-7" />
      <span className="font-display text-[19px] font-semibold tracking-[-0.02em]">{APP_NAME}</span>
    </span>
  );
}
