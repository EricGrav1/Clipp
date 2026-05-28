import { Suspense } from "react";
import { CheckoutStart } from "@/components/checkout-start";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ interval?: string }>;
}) {
  const { interval } = await searchParams;
  const billingInterval = interval === "yearly" ? "yearly" : "monthly";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Suspense>
        <CheckoutStart interval={billingInterval} />
      </Suspense>
    </main>
  );
}
