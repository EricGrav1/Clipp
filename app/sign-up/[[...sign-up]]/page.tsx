import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <SignUp fallbackRedirectUrl="/app" signInUrl="/sign-in" />
    </main>
  );
}
