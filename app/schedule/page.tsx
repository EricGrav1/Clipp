import Link from "next/link";
import { ScheduleBoard } from "@/components/social/schedule-board";
import { Button } from "@/components/ui/button";
import { BearFarmer } from "@/components/ui/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { requireUserAccount } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { toScheduledPostDTO } from "@/lib/social";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const account = await requireUserAccount();

  if (!hasActiveSubscription(account)) {
    redirect("/pricing?required=subscription");
  }

  const posts = await prisma.scheduledPost.findMany({
    where: { userAccountId: account.id },
    orderBy: { scheduledAt: "asc" },
    include: {
      clip: {
        include: {
          project: {
            select: { name: true },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex animate-fade-in items-center justify-between gap-3">
          <Link className="flex items-center gap-2.5" href="/">
            <BearFarmer size={40} className="animate-bob" />
            <div className="leading-none">
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Clip Farmer
              </span>
              <span className="block text-[11px] font-semibold text-muted-foreground">
                plant a video, harvest the clips
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/app">Dashboard</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <ScheduleBoard initialPosts={posts.map(toScheduledPostDTO)} />
      </div>
    </main>
  );
}
