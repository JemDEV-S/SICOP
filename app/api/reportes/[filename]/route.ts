import { readReportePdf } from "@/lib/reportes-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const pdf = await readReportePdf(filename);

  if (!pdf) {
    return new Response("Reporte no encontrado", { status: 404 });
  }

  return new Response(pdf.buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.size),
      "Content-Disposition": `inline; filename="${filename.replaceAll('"', "")}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
