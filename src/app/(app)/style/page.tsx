import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, X } from "lucide-react";
import { IconSubmitButton, SubmitButton } from "@/components/client";
import { EmptyState, PageHeader, Panel, SectionHeader, buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/data/session";
import { buildNotebook, readStats, type NoteSource } from "@/lib/voice/notebook";
import { clearLearned, removeNote } from "./actions";
import { AddNoteForm, LearnAgainForm } from "./forms";

export const metadata: Metadata = { title: "How you write" };

const SOURCE_LABEL: Record<NoteSource, string> = {
  edits: "From your edits",
  learned: "From your writing",
  you: "Added by you",
};

function RemoveButton({ noteKey, label }: { noteKey: string; label: string }) {
  return (
    <form action={removeNote}>
      <input type="hidden" name="key" value={noteKey} />
      <IconSubmitButton
        label={`Remove: ${label}`}
        icon={X}
        className="-my-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
      />
    </form>
  );
}

export default async function StylePage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("voice_profiles")
    .select("summary, sample_posts, notes, muted, edit_stats, refreshed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const book = buildNotebook(data);
  const stats = readStats(data?.edit_stats);
  const samples = (data?.sample_posts ?? []).length;
  const empty = !book.notes.length && !book.avoidWords.length && !book.summary;

  return (
    <>
      <div>
        <Link href="/onboarding" className={buttonClass("ghost", "-ml-3 px-3", "sm")}>
          <ArrowLeft aria-hidden />
          Settings
        </Link>
        <div className="mt-2">
          <PageHeader
            title="How you write"
            description="A private notebook of your writing style, so drafts sound like you. It learns from your sample posts and from the changes you make before posting. Change anything you disagree with."
          />
        </div>
      </div>

      <p className="-mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        Kept in your account and used only for your drafts. Never shared, and never used to train AI models. It holds notes about
        style, never what your posts say.
      </p>

      {book.summary && (
        <Panel>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Your voice</p>
          <p className="mt-1.5 text-[15px] leading-relaxed">{book.summary}</p>
        </Panel>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeader title="What we've noticed" count={book.notes.length} />
        {empty ? (
          <EmptyState icon={Lock} title="Nothing learned yet">
            Add two or three posts you wrote in Settings, or post a draft after editing it. We&apos;ll note how you write.
          </EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {book.notes.map((note) => (
              <li key={note.key} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-relaxed">{note.text}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{SOURCE_LABEL[note.source]}</p>
                </div>
                <RemoveButton noteKey={note.key} label={note.text} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {book.avoidWords.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeader title="Words you remove" count={book.avoidWords.length} />
          <p className="-mt-1 text-sm text-muted">Drafts leave these out, and a quiet note appears if one slips in.</p>
          <ul className="flex flex-wrap gap-2">
            {book.avoidWords.map((word) => (
              <li key={word} className="flex items-center rounded-full border border-border-strong pl-3.5">
                <span className="text-sm font-medium">{word}</span>
                <RemoveButton noteKey={`avoid:${word}`} label={word} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel className="flex flex-col gap-5">
        <AddNoteForm />
        <div className="border-t border-border pt-4">
          <p className="text-sm leading-relaxed text-muted">
            {stats.pairs > 0
              ? `Learned from ${stats.pairs} ${stats.pairs === 1 ? "post you edited" : "posts you edited"}`
              : "No edited posts yet"}
            {samples > 0 ? ` and ${samples} sample ${samples === 1 ? "post" : "posts"}.` : ". "}
            {samples === 0 && (
              <Link href="/onboarding#voice" className="link">
                Add sample posts
              </Link>
            )}
          </p>
          <div className="mt-3">
            <LearnAgainForm />
          </div>
        </div>
      </Panel>

      {!empty && (
        <form action={clearLearned} className="flex flex-wrap items-center gap-2">
          <SubmitButton variant="danger" size="sm" pendingLabel="Clearing…">
            Clear what we&apos;ve learned
          </SubmitButton>
          <span className="text-[13px] text-muted">Keeps your own notes and sample posts.</span>
        </form>
      )}
    </>
  );
}
