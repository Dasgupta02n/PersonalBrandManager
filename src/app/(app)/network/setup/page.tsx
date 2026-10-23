import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { loadGoals } from "@/lib/data/network";
import { requireUser } from "@/lib/data/session";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Network questions" };

export default async function NetworkSetupPage() {
  const { db, user } = await requireUser();
  const [goals, rules] = await Promise.all([
    loadGoals(db, user.id),
    db.from("confidentiality_rules").select("employer_name").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <>
      <Link href="/network" className="-mb-4 flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
        <ChevronLeft aria-hidden className="size-4" />
        Network
      </Link>
      <PageHeader
        title={goals ? "Your answers" : "What you're working towards"}
        description="Private to you. Your answers decide which search firms and which people at other companies we suggest. Change them any time."
      />
      <SetupForm goals={goals} employer={rules.data?.employer_name ?? null} />
    </>
  );
}
