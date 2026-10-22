import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-ink-foreground hover:bg-ink-hover",
  secondary: "border border-border-soft bg-background text-foreground hover:border-border-strong hover:bg-band",
  ghost: "text-muted hover:bg-surface hover:text-foreground",
  danger: "text-danger hover:bg-danger-soft",
};

// Every size keeps a 44px+ touch target; the sticky primary bar uses lg (52px).
const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3.5 text-[15px]",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-[52px] px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", extra?: string, size: ButtonSize = "md") {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0",
    buttonSizes[size],
    buttonStyles[variant],
    extra,
  );
}

/** Grouped content sits on a tonal inset, not a floating white card. */
export function Panel({ className, tone = "inset", ...props }: ComponentProps<"section"> & { tone?: "inset" | "outline" }) {
  return (
    <section
      className={cx(
        "rounded-xl p-4 sm:p-5",
        tone === "inset" ? "bg-surface" : "border border-border",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] font-medium text-muted">{eyebrow}</p>}
        <h1 className="mt-0.5 font-display text-display-m font-medium text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionHeader({ title, count, action }: { title: ReactNode; count?: number; action?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">
        {title}
        {count !== undefined && count > 0 && <span className="tabular-nums">· {count}</span>}
      </h2>
      {action}
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cx("block text-sm font-semibold", className)} {...props} />;
}

export function Hint({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={cx("mt-1.5 text-[13px] leading-snug text-muted", className)}>
      {children}
    </p>
  );
}

const fieldClass =
  "mt-1.5 block w-full rounded-lg border border-border-strong bg-field px-3.5 py-3 text-base text-foreground " +
  "transition-colors duration-150 placeholder:text-subtle focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldClass, "min-h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldClass, "min-h-28 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(fieldClass, "min-h-12", className)} {...props} />;
}

export type Tone = "neutral" | "accent" | "brass" | "success" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-surface text-foreground",
  accent: "bg-accent-soft text-accent",
  brass: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

// Notices keep their text in ink: colour lives in the icon and the tint only.
const noticeStyles: Record<Tone, { box: string; icon: string }> = {
  neutral: { box: "bg-caution-soft", icon: "text-caution" },
  accent: { box: "bg-accent-soft", icon: "text-accent" },
  brass: { box: "bg-accent-soft", icon: "text-accent" },
  success: { box: "bg-success-soft", icon: "text-success" },
  danger: { box: "bg-danger-soft", icon: "text-danger" },
};

export function Badge({ tone = "neutral", icon: Icon, children }: { tone?: Tone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap",
        toneStyles[tone],
      )}
    >
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  );
}

const noticeIcons: Record<Tone, LucideIcon> = {
  neutral: TriangleAlert,
  accent: Info,
  brass: BadgeCheck,
  success: CircleCheck,
  danger: CircleAlert,
};

/** A message with an icon. Neutral is for "check this" notes, so colour never carries meaning alone. */
export function Notice({ tone = "accent", icon, children }: { tone?: Tone; icon?: LucideIcon; children: ReactNode }) {
  const Icon = icon ?? noticeIcons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("flex gap-2.5 rounded-lg px-3.5 py-3 text-[15px] text-foreground", noticeStyles[tone].box)}
    >
      <Icon aria-hidden className={cx("mt-0.5 size-[18px] shrink-0", noticeStyles[tone].icon)} />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-soft px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-surface text-muted">
        <Icon aria-hidden className="size-5" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-border", className)} />;
}
