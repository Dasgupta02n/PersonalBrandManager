"use client";

import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, LoaderCircle, Printer } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./ui";

/** Submit button that shows a spinner and an honest pending label while its server action runs. */
export function SubmitButton({
  pendingLabel,
  variant = "primary",
  size,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: ButtonVariant; size?: ButtonSize }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass(variant, className, size)} {...props}>
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="animate-spin" />
          <span aria-live="polite">{pendingLabel ?? "Working…"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Copies text to the clipboard and confirms with a check mark. */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  size,
  className,
  onCopied,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass(variant, className, size)}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          onCopied?.();
          setTimeout(() => setCopied(false), 2000);
        }
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Hidden input pre-filled with the browser's time zone. */
export function TimeZoneField({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value] = useState(() => {
    if (defaultValue && defaultValue !== "UTC") return defaultValue;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultValue;
    } catch {
      return defaultValue;
    }
  });
  return <input type="hidden" name={name} value={value} />;
}

/** Opens the browser's print dialog, which also saves as PDF. */
export function PrintButton({ label = "Print or save as PDF", variant = "secondary", size }: { label?: string; variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass(variant, "print:hidden", size)}>
      <Printer aria-hidden />
      {label}
    </button>
  );
}
