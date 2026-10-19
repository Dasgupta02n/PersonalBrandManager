import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { DesktopNav, MobileTabBar } from "@/components/app-nav";
import { Wordmark } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

/** Posts waiting for the user: drafts to review and drafts ready to post. */
async function openDraftCount(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return 0;
  const { count } = await supabase
    .from("drafts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", data.user.id)
    .eq("kind", "post")
    .in("status", ["ready", "draft"]);
  return count ?? 0;
}

const iconButton =
  "flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const draftCount = await openDraftCount();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between gap-4 px-4">
          <Link href="/today" aria-label="Today">
            <Wordmark />
          </Link>
          <DesktopNav draftCount={draftCount} />
          <div className="flex items-center">
            <Link href="/onboarding" aria-label="Settings" title="Settings" className={iconButton}>
              <Settings aria-hidden className="size-5" />
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" aria-label="Sign out" title="Sign out" className={iconButton}>
                <LogOut aria-hidden className="size-5" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-8 px-4 pt-6 pb-28 sm:pt-8 md:pb-16 has-[[data-pushed]]:pb-0">
        {children}
      </main>
      <MobileTabBar draftCount={draftCount} />
    </div>
  );
}
