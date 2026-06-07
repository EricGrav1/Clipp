# Clip Farmer

Paid SaaS foundation for clipping long-form creator and podcast videos into reusable social clips. Built with Next.js, TypeScript, Tailwind CSS, Prisma, Clerk-ready auth, Stripe Billing, Cloudflare R2-compatible storage hooks, FFmpeg rendering, and Ayrshare-style social scheduling.

## Local Development

```bash
npm install
cp .env.example .env
DATABASE_URL="your-postgres-connection-string" npm run db:deploy
npx prisma generate
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

When Clerk and Stripe env vars are blank, local development uses a `dev-user` account with an active subscription fallback. When R2 env vars are blank, uploaded source videos and generated clips are stored in `public/uploads` and `public/clips`. When Ayrshare env vars are blank, social scheduling uses demo connected accounts and mock scheduled posts.

Set `FOUNDER_EMAIL` before enabling Clerk if you want the first founder login to claim projects created during local dev. Passwords are managed by Clerk and are not stored by Clip Farmer.

## Database

Clip Farmer uses Postgres through:

```env
DATABASE_URL="postgresql://..."
```

The production migration SQL is checked in under `prisma/migrations`. Run `npm run db:deploy` after setting `DATABASE_URL`.

## Social Scheduling

The Account page includes social account connection management. With Ayrshare configured, Clip Farmer creates a user profile, opens the provider-managed linking page, stores the profile key server-side, and schedules ready clips through `/api/post` using provider-accessible HTTPS media URLs.

Required production settings:

```env
AYRSHARE_API_KEY=""
AYRSHARE_PRIVATE_KEY=""
AYRSHARE_JWT_DOMAIN=""
SOCIAL_WEBHOOK_SECRET=""
```

For production posting, rendered clip URLs must be public HTTPS URLs. Use `R2_PUBLIC_BASE_URL` or another durable CDN URL so the social provider can fetch scheduled media.

## Rendering Worker

Local development can render from the Next.js API route. Production should run
FFmpeg in a separate long-running worker service because Vercel functions are
not reliable for video rendering.

Worker command:

```bash
npm run worker
```

The worker polls Postgres for queued render jobs, runs FFmpeg, uploads finished
clips to R2, and marks clips `READY` or `FAILED`.

Required worker environment:

```env
DATABASE_URL="postgresql://..."
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET=""
R2_PUBLIC_BASE_URL=""
```

Optional worker settings:

```env
RENDER_WORKER_POLL_MS="3000"
RENDER_WORKER_STALE_AFTER_MS="600000"
```

Set `RENDER_IN_API=true` only for temporary debugging. Production should leave it
unset so Vercel queues work and the worker performs rendering.

## Production Launch Notes

- Use Clerk for auth and protect `/app`, `/projects`, account, and API routes.
- Use Stripe Checkout Sessions in subscription mode and configure the webhook at `/api/billing/webhook`.
- Create Coupons and Promotion Codes in Stripe Dashboard for campaigns; Checkout has promotion-code entry enabled for subscriptions.
- Use a hosted Postgres database such as Neon for production.
- Use Cloudflare R2 or S3-compatible object storage for source videos and clips.
- Run FFmpeg rendering in a separate worker for production with `npm run worker`.
- Configure Ayrshare webhooks at `/api/social/webhook` and send `x-social-webhook-secret` when `SOCIAL_WEBHOOK_SECRET` is set.
- Replace starter Terms/Privacy copy with counsel-reviewed policies before promoting publicly.
