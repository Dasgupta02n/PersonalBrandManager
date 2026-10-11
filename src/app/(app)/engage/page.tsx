import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/data/session";
import { CommentStarters } from "./starters";

export const metadata: Metadata = { title: "Comment" };

export default async function CommentPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Add to a conversation"
        description="Comment where the people who matter are talking. You get three ways in; you finish the comment and post it yourself."
      />
      <CommentStarters />
    </>
  );
}
