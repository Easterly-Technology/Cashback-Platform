import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { runTrackedJob } from "@/lib/admin-jobs";
import { requireSuperAdmin } from "@/lib/admin-session";
import {
  TRACKED_JOB_NAMES,
  type TrackedJobName,
} from "@/lib/job-runs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobName: string }> },
) {
  const session = await requireSuperAdmin();

  if (!session.ok) {
    return session.response;
  }

  const { jobName } = await params;

  if (!TRACKED_JOB_NAMES.includes(jobName as TrackedJobName)) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const result = await runTrackedJob(jobName as TrackedJobName, session.admin.id);

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "RUN_SYSTEM_JOB",
      resourceType: "SYSTEM_JOB",
      resourceId: result.runId,
      details: {
        jobName,
        status: "SUCCESS",
        summary: result.summary,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      runId: result.runId,
      summary: result.summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "RUN_SYSTEM_JOB",
      resourceType: "SYSTEM_JOB",
      details: {
        jobName,
        status: "FAILED",
        error: message,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ error: message }, { status: 500 });
  }
}
