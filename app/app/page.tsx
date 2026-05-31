import { ProjectHome } from "@/components/project-home";
import { requireUserAccount } from "@/lib/auth";
import { hasActiveSubscription, refreshSubscriptionFromStripe } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  let account = await requireUserAccount();
  account = await refreshSubscriptionFromStripe(account);

  if (!hasActiveSubscription(account)) {
    redirect("/pricing?required=subscription");
  }

  const projects = await prisma.project.findMany({
    where: { userAccountId: account.id },
    orderBy: { updatedAt: "desc" },
    include: {
      video: true,
      _count: {
        select: { clips: true },
      },
    },
  });

  return <ProjectHome projects={projects} />;
}
