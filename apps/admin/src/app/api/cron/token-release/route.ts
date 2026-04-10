import { runTrackedJob } from "@/lib/admin-jobs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTrackedJob("token-release");

    return Response.json({
      success: true,
      runId: result.runId,
      ...result.summary,
    });
  } catch (error) {
    console.error("[CRON] token-release failed:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Job failed",
      },
      { status: 500 },
    );
  }
}
