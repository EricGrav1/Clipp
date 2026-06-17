import { prisma } from "../lib/prisma";
import { processRenderJob } from "../lib/render-jobs";

const pollMs = Number(process.env.RENDER_WORKER_POLL_MS ?? 1_000);
const staleAfterMs = Number(process.env.RENDER_WORKER_STALE_AFTER_MS ?? 10 * 60 * 1_000);
let isShuttingDown = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findNextRenderJob() {
  const staleBefore = new Date(Date.now() - staleAfterMs);

  return prisma.renderJob.findFirst({
    where: {
      OR: [
        { status: "QUEUED" },
        {
          status: "RENDERING",
          startedAt: {
            lt: staleBefore,
          },
        },
      ],
    },
    orderBy: {
      queuedAt: "asc",
    },
    select: {
      id: true,
      status: true,
    },
  });
}

async function processNextRenderJob() {
  const job = await findNextRenderJob();

  if (!job) {
    return false;
  }

  console.log(`[render-worker] processing ${job.id} (${job.status})`);

  try {
    await processRenderJob(job.id);
    console.log(`[render-worker] completed ${job.id}`);
  } catch (error) {
    console.error(`[render-worker] failed ${job.id}`, error);
  }

  return true;
}

async function run() {
  console.log(`[render-worker] started; polling every ${pollMs}ms`);

  while (!isShuttingDown) {
    const processedJob = await processNextRenderJob();

    if (!processedJob) {
      await sleep(pollMs);
    }
  }
}

async function shutdown() {
  isShuttingDown = true;
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

run()
  .catch(async (error) => {
    console.error("[render-worker] crashed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
