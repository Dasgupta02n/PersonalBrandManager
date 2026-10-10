import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/data/session";
import { CommentForm } from "./comment-form";

export const metadata: Metadata = { title: "Engage" };

export default async function EngagePage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Join the conversation"
        description="Comment where the people who matter are talking. Paste a post and pick a comment to copy. You post it yourself."
      />
      <CommentForm />
    </>
  );
}
