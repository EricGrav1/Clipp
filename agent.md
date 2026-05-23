# Clipper Studio Agent Notes

## Current Build State

Clipper Studio is a local-first video clipping app built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Prisma Client
- SQLite for local development
- FFmpeg for server-side clip rendering

The current app has a project list home page, a project editor at `/projects/[projectId]`, source video upload, HTML5 video playback, timeline controls, fixed clip duration buttons, clip creation through FFmpeg, and a right-side clips pane with preview, rename, delete, and download actions.

## Build History

This repository started as an empty Git repository. The current build was scaffolded in place with the app structure, package manifest, Tailwind config, ESLint config, Prisma schema, SQLite migration SQL, API routes, reusable UI primitives, and editor components.

Major pieces added so far:

- Project creation and listing.
- Project editor shell with upload and video playback.
- Local media storage in `public/uploads` and `public/clips`.
- Prisma models for `Project`, `Video`, and `Clip`.
- Upload API for mp4, mov, and webm files.
- Clip metadata creation with start/end/duration clamping.
- FFmpeg rendering to generated mp4 files.
- Clip status handling for rendering, ready, and failed states.
- Clips pane actions for preview, rename, delete, and download.

## Local Setup Commands

```bash
npm install
npm run db:init
npx prisma generate
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open the app at:

```text
http://127.0.0.1:3000
```

## Known Fixes

If the browser shows an error like `Cannot find module './331.js'`, the Next.js dev server is using stale `.next` chunks. Stop any stale processes on port `3000`, delete `.next`, and restart the dev server.

```bash
lsof -ti tcp:3000
kill <pid>
rm -rf .next
npm run dev -- --hostname 127.0.0.1 --port 3000
```

If Prisma `db push` or `migrate` fails with a blank `Schema engine error`, use the checked-in SQLite migration SQL through:

```bash
npm run db:init
```

FFmpeg must be installed and available on `PATH`. On this machine it was found at:

```text
/opt/homebrew/bin/ffmpeg
```

## Rollback Guidance

Use Git to inspect exactly what changed before reverting anything:

```bash
git status --short
git diff
```

Generated runtime artifacts can be removed and regenerated:

- `.next`
- `node_modules`
- `prisma/dev.db`
- uploaded files in `public/uploads`
- generated clips in `public/clips`

Do not delete source files unless intentionally reverting the app scaffold or a specific feature implementation.
