import { AllowanceExhaustedError } from "@/lib/billing/allowance";
import { PrivacyUnavailableError } from "@/lib/privacy/detect";
import { AiOutputError, AiRefusalError } from "./client";

/** A message that is safe and helpful to show the user when an AI step fails. */
export function friendlyAiError(error: unknown): string {
  if (error instanceof AllowanceExhaustedError) return error.message;
  if (error instanceof PrivacyUnavailableError) {
    return "The check that removes names before anything reaches the AI isn't available for a moment, so nothing was sent. Please try again shortly.";
  }
  if (error instanceof AiRefusalError) {
    return "The AI couldn't help with that entry. Try rephrasing it.";
  }
  if (error instanceof AiOutputError) {
    return "The AI response came back incomplete. Please try again.";
  }
  if (error instanceof Error && error.message.includes("OPENROUTER_API_KEY")) {
    return "AI isn't configured yet (missing API key).";
  }
  console.error("AI step failed:", error);
  return "Something went wrong while generating. Please try again.";
}
