import { ProjectHome } from "@/components/project-home";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
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
