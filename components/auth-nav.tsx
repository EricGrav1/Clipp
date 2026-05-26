"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthNav({ isClerkEnabled }: { isClerkEnabled: boolean }) {
  if (!isClerkEnabled) {
    return (
      <>
        <Button asChild variant="ghost">
          <Link href="/app">Log in</Link>
        </Button>
        <div className="hidden sm:block">
          <Button asChild variant="primary">
            <Link href="/app">Start harvesting</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost">Log in</Button>
        </SignInButton>
        <div className="hidden sm:block">
          <SignUpButton mode="modal">
            <Button variant="primary">Start harvesting</Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <Button asChild variant="secondary">
          <Link href="/app">Open app</Link>
        </Button>
        <UserButton />
      </Show>
    </>
  );
}
