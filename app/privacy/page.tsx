import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-card p-8 shadow-panel">
        <Link className="font-display text-xl font-extrabold" href="/">
          Clip Farmer
        </Link>
        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Clip Farmer stores account, billing, project, upload, and render
          metadata needed to operate the service. Source videos and rendered
          clips are stored in object storage while your subscription is active or
          until you delete them.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Payments are processed by Stripe. Authentication is handled by Clerk.
          Do not publish this page as final legal advice until reviewed for your
          actual company, jurisdictions, retention policy, and subprocessors.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Support contact: support@clipfarmer.app
        </p>
      </article>
    </main>
  );
}
