import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { getTokenSettingsSnapshot } from "@cashback/shared";
import { auth } from "@/lib/auth";

export default async function TokenHistoryPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [releases, settings] = await Promise.all([
    prisma.tokenReleaseLog.findMany({
      where: { userId },
      orderBy: { releaseDate: "desc" },
      take: 100,
    }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["token_release_rate"],
        },
      },
    }),
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-4">Token Release History</h1>
      <p className="mb-4 text-sm text-gray-500">
        Daily release rate: {(tokenSettings.releaseRate * 100).toLocaleString()}%
      </p>
      <div className="bg-white rounded-xl border">
        {releases.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No release history yet</p>
        ) : (
          releases.map((release) => (
            <div
              key={release.id}
              className="flex justify-between items-center text-sm p-3 border-b last:border-0"
            >
              <span className="text-gray-500">
                {release.releaseDate.toISOString().split("T")[0]}
              </span>
              <span className="text-green-600 font-medium">
                +{Number(release.amount).toLocaleString()}
              </span>
              <span className="text-gray-400 text-xs">
                Cumulative: {Number(release.cumulative).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
