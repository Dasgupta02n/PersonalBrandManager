import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/client";
import { Badge, Card, Input, Label, Notice, PageHeader } from "@/components/ui";
import type { GuardrailReport } from "@/lib/ai/tasks";
import { requireUser } from "@/lib/data/session";
import { discardDraft, markPosted } from "./actions";
import { DraftEditor } from "./editor";

export const metadata: Metadata = { title: "Draft" };

export default async function DraftPage({ params }: PageProps<"/drafts/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: draft } = await supabase
    .from("drafts")
    .select("id, kind, status, hook, body, hashtags, guardrails, posted_at, post_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("kind", "post")
    .maybeSingle();
  if (!draft || draft.status === "discarded") notFound();

  const report = (draft.guardrails ?? null) as GuardrailReport | null;
  const errors = report?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = report?.issues.filter((i) => i.severity === "warning") ?? [];
  const posted = draft.status === "posted";

  return (
    <>
      <Link href="/drafts" className="text-sm font-semibold text-accent">
        ← All drafts
      </Link>
      <PageHeader
        title={posted ? "Posted" : draft.status === "ready" ? "Ready to post" : "Needs your review"}
        action={posted ? <Badge>Posted</Badge> : <Badge tone={draft.status === "ready" ? "success" : "warning"}>Checks</Badge>}
      />

      {report && (
        <Card className="flex flex-col gap-2 text-sm">
          <h2 className="font-semibold">Checks</h2>
          {report.passed ? (
            <Notice tone="success">
              Confidentiality, facts and tone checks passed{report.revised ? " after an automatic fix" : ""}.
            </Notice>
          ) : (
            <ul className="flex flex-col gap-1">
              {report.jobSearchSignal && !report.revised && (
                <li className="text-danger">This may read as if you&apos;re looking for a job.</li>
              )}
              {errors.map((issue, i) => (
                <li key={`e${i}`} className="text-danger">
                  {issue.message}
                </li>
              ))}
              {!report.revised && report.unsupportedClaims.map((claim, i) => (
                <li key={`u${i}`} className="text-danger">
                  Not supported by your wins: {claim}
                </li>
              ))}
              {!report.revised && report.confidentialityProblems.map((problem, i) => (
                <li key={`c${i}`} className="text-danger">
                  Confidentiality: {problem}
                </li>
              ))}
            </ul>
          )}
          {warnings.map((issue, i) => (
            <p key={`w${i}`} className="text-warning">
              {issue.message}
            </p>
          ))}
        </Card>
      )}

      <Card>
        <DraftEditor draftId={draft.id} body={draft.body} hashtags={draft.hashtags} />
      </Card>

      {!posted ? (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold">Posted it?</h2>
          <form action={markPosted.bind(null, draft.id)} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="postUrl">Link to your post (optional)</Label>
              <Input id="postUrl" name="postUrl" type="url" placeholder="https://www.linkedin.com/posts/…" />
            </div>
            <div className="flex flex-wrap gap-2">
              <SubmitButton pendingLabel="Saving…">Mark as posted</SubmitButton>
            </div>
          </form>
          <form action={discardDraft.bind(null, draft.id)}>
            <SubmitButton variant="danger" pendingLabel="Discarding…">
              Discard draft
            </SubmitButton>
          </form>
        </Card>
      ) : (
        draft.post_url && (
          <a href={draft.post_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent">
            View on LinkedIn
          </a>
        )
      )}
    </>
  );
}
