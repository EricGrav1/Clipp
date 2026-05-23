# Clipper Studio

Lightweight local video clipping tool built with Next.js, TypeScript, Tailwind CSS, shadcn-style UI components, Prisma, SQLite, and FFmpeg.

## Local Development

```bash
npm install
npm run db:init
npx prisma generate
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The app stores uploaded source videos in `public/uploads` and generated clips in `public/clips`, which are served as `/uploads/...` and `/clips/...`.

## Database

The SQLite development database lives at `prisma/dev.db` through:

```env
DATABASE_URL="file:./dev.db"
```

The initial schema SQL is checked in at `prisma/migrations/20260523150100_init/migration.sql`. `npm run db:init` creates the local database from that migration. In this environment, Prisma's schema engine returned a blank `Schema engine error` for `prisma db push`, so the local `dev.db` was created from that SQL migration with `sqlite3`.

## FFmpeg

Clip rendering expects `ffmpeg` to be installed and available on `PATH`.
