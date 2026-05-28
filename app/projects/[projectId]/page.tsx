import { notFound, redirect } from "next/navigation";
import { EditorWorkspace } from "@/components/editor-workspace";
import { requireUserAccount } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const account = await requireUserAccount();

  if (!hasActiveSubscription(account)) {
    redirect("/pricing?required=subscription");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userAccountId: account.id },
    include: {
      video: true,
      clips: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return <EditorWorkspace project={project} />;
}
