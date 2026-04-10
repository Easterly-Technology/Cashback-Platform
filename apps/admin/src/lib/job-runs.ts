import { Prisma, prisma } from "@cashback/database";

export const TRACKED_JOB_NAMES = [
  "token-pool",
  "token-release",
  "marketplace-generate",
] as const;

export type TrackedJobName = (typeof TRACKED_JOB_NAMES)[number];

export async function startSystemJobRun(
  jobName: TrackedJobName,
  triggeredBy?: string,
) {
  return prisma.systemJobRun.create({
    data: {
      jobName,
      status: "RUNNING",
      triggeredBy,
    },
  });
}

export async function completeSystemJobRun(
  id: string,
  summary: Prisma.InputJsonValue,
) {
  return prisma.systemJobRun.update({
    where: { id },
    data: {
      status: "SUCCESS",
      summary,
      finishedAt: new Date(),
      error: null,
    },
  });
}

export async function failSystemJobRun(
  id: string,
  error: string,
  summary?: Prisma.InputJsonValue,
) {
  return prisma.systemJobRun.update({
    where: { id },
    data: {
      status: "FAILED",
      error,
      summary: summary ?? Prisma.JsonNull,
      finishedAt: new Date(),
    },
  });
}

export function normalizeJobError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown job failure";
}

export async function getTrackedJobHealth() {
  const runs = await prisma.systemJobRun.findMany({
    where: {
      jobName: {
        in: [...TRACKED_JOB_NAMES],
      },
    },
    orderBy: { startedAt: "desc" },
    take: 40,
  });

  return TRACKED_JOB_NAMES.map((jobName) => {
    const jobRuns = runs.filter((run) => run.jobName === jobName);
    const latest = jobRuns[0] ?? null;
    const latestSuccess =
      jobRuns.find((run) => run.status === "SUCCESS") ?? null;
    const latestFailure = jobRuns.find((run) => run.status === "FAILED") ?? null;

    return {
      jobName,
      latest,
      latestSuccess,
      latestFailure,
    };
  });
}
