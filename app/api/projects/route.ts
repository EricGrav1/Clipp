import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertProjectName } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
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

    return NextResponse.json({ projects });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const account = await requireUserAccount();
    const body = await request.json();
    const name = assertProjectName(body.name);
    const project = await prisma.project.create({
      data: { name, userAccountId: account.id },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
