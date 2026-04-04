import { prisma } from "@cashback/database";

export async function GET() {
  const settings = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
  });
  return Response.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { key, value } = body;

  const setting = await prisma.platformSetting.update({
    where: { key },
    data: { value },
  });
  return Response.json(setting);
}
