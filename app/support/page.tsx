import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="max-w-xl rounded-[1.5rem] border border-border bg-card p-8 shadow-panel">
        <Link className="font-display text-xl font-extrabold" href="/">
          Clip Farmer
        </Link>
        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">
          Support
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Need help with billing, uploads, or rendered clips? Email
          support@clipfarmer.app with your account email and project name.
        </p>
      </section>
    </main>
  );
}
