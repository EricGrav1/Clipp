import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-card p-8 shadow-panel">
        <Link className="font-display text-xl font-extrabold" href="/">
          Clip Farmer
        </Link>
        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Clip Farmer is a paid video clipping service for processing content
          you have the right to upload and transform. You are responsible for
          the videos you upload and any social platforms where you post clips.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Subscriptions renew monthly until cancelled. Render limits apply per
          billing period. Files are kept while subscribed unless deleted by the
          user or removed under an abuse, legal, or operational policy.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Replace this starter text with counsel-reviewed terms before launch.
        </p>
      </article>
    </main>
  );
}
