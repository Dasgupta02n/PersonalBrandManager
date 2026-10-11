"use client";

import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { buttonClass, type ButtonVariant } from "./ui";

/** Submit button that shows a spinner and pending label while its form's server action runs. */
export function SubmitButton({
  pendingLabel,
  variant = "primary",
  size,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={buttonClass(variant, className, size)}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="animate-spin" />
          {pendingLabel ?? "Working…"}
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
  label = "Copy text",
  variant = "primary",
  className,
}: {
  text: string;
  label?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass(variant, className)}
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
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
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
