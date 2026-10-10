"use client";

import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

/** Submit button that shows a pending label while its form's server action runs. */
export function SubmitButton({
  pendingLabel,
  variant = "primary",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, className)} {...props}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

/** Copies text to the clipboard, falling back to selecting nothing if the API is unavailable. */
export function CopyButton({ text, label = "Copy text" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass("primary")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
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
