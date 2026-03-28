import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { requireOrgUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { orgId, error } = await requireOrgUser();
    if (error) return error;

    const parties = await prisma.party.findMany({
      where: { orgId: orgId! },
      include: {
        cheques: { orderBy: { date: { sort: "asc", nulls: "last" } } },
      },
      orderBy: { name: "asc" },
    });

    const workbook = XLSX.utils.book_new();

    for (const party of parties) {
      const data = party.cheques.map((c) => ({
        Date: c.date
          ? new Date(c.date).toLocaleDateString("en-GB")
          : "",
        "Cheque Number": c.chequeNumber,
        Amount: Number(c.amount),
        Status: c.status,
        Remarks: c.remarks || "",
      }));

      const sheet = XLSX.utils.json_to_sheet(data);
      const safeName = party.name.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, "");
      XLSX.utils.book_append_sheet(workbook, sheet, safeName);
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="ARK_Cheques_Export.xlsx"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
