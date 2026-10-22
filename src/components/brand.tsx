import { APP_NAME } from "@/lib/config/app";
import { cx } from "./ui";

/**
 * The mark: a small brick wall on an ink square, laid course by course like the record itself,
 * with the newest brick picked out. Monochrome and drawn with shapes only, so it holds up on white,
 * in a dark browser tab and at favicon sizes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cx("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="7" fill="#111419" />
      <g fill="#ffffff">
        <rect x="7" y="7" width="8.25" height="5" rx="1.25" fillOpacity="0.5" />
        <rect x="16.75" y="7" width="8.25" height="5" rx="1.25" />
        <rect x="7" y="13.5" width="3.375" height="5" rx="1.25" fillOpacity="0.5" />
        <rect x="11.875" y="13.5" width="8.25" height="5" rx="1.25" fillOpacity="0.5" />
        <rect x="21.625" y="13.5" width="3.375" height="5" rx="1.25" fillOpacity="0.5" />
        <rect x="7" y="20" width="8.25" height="5" rx="1.25" fillOpacity="0.5" />
        <rect x="16.75" y="20" width="8.25" height="5" rx="1.25" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("flex shrink-0 items-center gap-2.5 whitespace-nowrap", className)}>
      <LogoMark className="size-7" />
      <span className="text-[19px] font-semibold tracking-[-0.02em]">{APP_NAME}</span>
    </span>
  );
}
