import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: checkoutSessionId } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10 sm:px-8">
      <OnboardingForm checkoutSessionId={checkoutSessionId} />
    </main>
  );
}
