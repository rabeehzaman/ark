import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile } from "@/lib/excel/parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parties = parseExcelFile(buffer);

    return NextResponse.json({
      parties,
      summary: {
        totalParties: parties.length,
        totalCheques: parties.reduce((sum, p) => sum + p.cheques.length, 0),
        totalAmount: parties.reduce((sum, p) => sum + p.totalAmount, 0),
        bouncedTotal: parties.reduce((sum, p) => sum + p.bouncedTotal, 0),
      },
    });
  } catch (error) {
    console.error("Import parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse Excel file" },
      { status: 500 }
    );
  }
}
