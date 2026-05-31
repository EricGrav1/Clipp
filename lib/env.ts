type Env = Record<string, string | undefined>;

export function trimmedEnvValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export function isPrintableAscii(value: string) {
  return /^[\x20-\x7E]+$/.test(value);
}

export function isClerkPublishableKey(value: string | undefined) {
  const key = trimmedEnvValue(value);

  if (
    !isPrintableAscii(key) ||
    (!key.startsWith("pk_test_") && !key.startsWith("pk_live_"))
  ) {
    return false;
  }

  const parts = key.split("_");
  if (parts.length !== 3 || !parts[2]) {
    return false;
  }

  try {
    const decoded = atob(parts[2]);
    const frontendApi = decoded.slice(0, -1);

    return (
      decoded.endsWith("$") &&
      !frontendApi.includes("$") &&
      frontendApi.includes(".")
    );
  } catch {
    return false;
  }
}

export function isClerkSecretKey(value: string | undefined) {
  const key = trimmedEnvValue(value);

  return Boolean(
    isPrintableAscii(key) &&
      (key.startsWith("sk_test_") || key.startsWith("sk_live_")),
  );
}

export function getClerkEnvironmentIssue(env: Env = process.env) {
  const publishableKey = trimmedEnvValue(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const secretKey = trimmedEnvValue(env.CLERK_SECRET_KEY);
  const stripeSecretKey = trimmedEnvValue(env.STRIPE_SECRET_KEY);

  if (!publishableKey && !secretKey) {
    return "Clerk is not configured.";
  }

  if (!isClerkPublishableKey(publishableKey)) {
    return "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not a valid Clerk publishable key.";
  }

  if (!isClerkSecretKey(secretKey)) {
    return "CLERK_SECRET_KEY is not a valid Clerk secret key.";
  }

  if (stripeSecretKey && secretKey === stripeSecretKey) {
    return "CLERK_SECRET_KEY matches STRIPE_SECRET_KEY. Paste the Clerk secret key into CLERK_SECRET_KEY and the Stripe secret key into STRIPE_SECRET_KEY.";
  }

  return null;
}

export function hasValidClerkEnvironment(env: Env = process.env) {
  return getClerkEnvironmentIssue(env) === null;
}
