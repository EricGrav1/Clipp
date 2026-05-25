import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

const DEV_CLERK_USER_ID = "dev-user";
const DEFAULT_FOUNDER_EMAIL = "EricGrav1@icloud.com";

export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

export async function requireUserAccount() {
  let clerkUserId = DEV_CLERK_USER_ID;
  let email: string | null = null;

  if (isClerkConfigured()) {
    const session = await auth();

    if (!session.userId) {
      throw new ValidationError("Sign in to continue.", 401);
    }

    clerkUserId = session.userId;
    const user = await currentUser();
    email = user?.primaryEmailAddress?.emailAddress ?? null;
  }

  const account = await prisma.userAccount.upsert({
    where: { clerkUserId },
    update: email ? { email } : {},
    create: {
      clerkUserId,
      email,
      subscriptionStatus: isClerkConfigured() ? "inactive" : "active",
    },
  });

  if (!isClerkConfigured()) {
    if (!account.email) {
      const updatedAccount = await prisma.userAccount.update({
        where: { id: account.id },
        data: { email: process.env.FOUNDER_EMAIL ?? DEFAULT_FOUNDER_EMAIL },
      });
      await prisma.project.updateMany({
        where: { userAccountId: null },
        data: { userAccountId: updatedAccount.id },
      });

      return updatedAccount;
    }

    await prisma.project.updateMany({
      where: { userAccountId: null },
      data: { userAccountId: account.id },
    });

    return account;
  }

  const founderEmail = process.env.FOUNDER_EMAIL ?? DEFAULT_FOUNDER_EMAIL;
  if (email?.toLowerCase() === founderEmail.toLowerCase()) {
    const devAccount = await prisma.userAccount.findUnique({
      where: { clerkUserId: DEV_CLERK_USER_ID },
      select: { id: true },
    });

    if (devAccount && devAccount.id !== account.id) {
      await prisma.project.updateMany({
        where: { userAccountId: devAccount.id },
        data: { userAccountId: account.id },
      });
      await prisma.socialConnection.updateMany({
        where: { userAccountId: devAccount.id },
        data: { userAccountId: account.id },
      });
      await prisma.scheduledPost.updateMany({
        where: { userAccountId: devAccount.id },
        data: { userAccountId: account.id },
      });
    }
  }

  return account;
}

export async function getUserAccount() {
  try {
    return await requireUserAccount();
  } catch {
    return null;
  }
}
