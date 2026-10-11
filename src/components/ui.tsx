import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-ink-foreground shadow-card hover:opacity-90",
  secondary: "border border-border-strong bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
  danger: "text-danger hover:bg-danger-soft",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", extra?: string, size: ButtonSize = "md") {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    buttonSizes[size],
    buttonStyles[variant],
    extra,
  );
}

export function Card({ className, tone = "raised", ...props }: ComponentProps<"section"> & { tone?: "raised" | "flat" | "sunken" }) {
  return (
    <section
      className={cx(
        "rounded-2xl p-5 sm:p-6",
        tone === "raised" && "border border-border bg-surface shadow-card",
        tone === "flat" && "border border-border bg-surface",
        tone === "sunken" && "bg-surface-2",
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
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.08em] text-subtle uppercase">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionHeader({ title, count, action }: { title: ReactNode; count?: number; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        {title}
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{count}</span>
        )}
      </h2>
      {action}
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cx("block text-sm font-semibold", className)} {...props} />;
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("mt-1.5 text-[13px] leading-snug text-muted", className)}>{children}</p>;
}

const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-base text-foreground " +
  "shadow-card transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent-soft focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldClass, "min-h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldClass, "min-h-28 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(fieldClass, "min-h-11", className)} {...props} />;
}

export type Tone = "neutral" | "accent" | "brass" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  brass: "bg-brass-soft text-brass",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", icon: Icon, children }: { tone?: Tone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        toneStyles[tone],
      )}
    >
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  );
}

const noticeIcons: Record<Tone, LucideIcon> = {
  neutral: Info,
  accent: Info,
  brass: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export function Notice({ tone = "accent", children }: { tone?: Tone; children: ReactNode }) {
  const Icon = noticeIcons[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("flex gap-2.5 rounded-xl px-3.5 py-3 text-sm", toneStyles[tone])}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-muted">
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

export function Stat({
  label,
  value,
  detail,
  progress,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  progress?: number;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
      {progress !== undefined && <Meter value={progress} />}
      {detail && <p className="text-xs text-subtle">{detail}</p>}
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
      <div className="h-full rounded-full bg-brass transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-border", className)} />;
}
