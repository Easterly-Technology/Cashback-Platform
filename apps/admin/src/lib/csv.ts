export function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue =
    value instanceof Date ? value.toISOString() : String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
) {
  const lines = [
    headers.map((header) => escapeCsvCell(header)).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

export function csvResponse(filename: string, content: string) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
