import { getReceiptDetails } from "@/lib/receipt-details";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const result = await getReceiptDetails(id, searchParams.get("sig"));

  if (!result.details) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.details);
}
