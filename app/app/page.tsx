import { ProjectHome } from "@/components/project-home";
import { requireUserAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const account = await requireUserAccount();
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
