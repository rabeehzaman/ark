import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { Prisma } from "@/generated/prisma/client";
import type { ParsedParty } from "@/lib/excel/parser";

export async function POST(req: NextRequest) {
  try {
    const { parties }: { parties: ParsedParty[] } = await req.json();

    if (!parties || !Array.isArray(parties)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    let partiesCreated = 0;
    let chequesCreated = 0;
    let errors: string[] = [];

    for (const partyData of parties) {
      try {
        const slug = slugify(partyData.name);

        const party = await prisma.party.upsert({
          where: { slug },
          create: { name: partyData.name, slug },
          update: {},
        });
        partiesCreated++;

        for (const chequeData of partyData.cheques) {
          try {
            await prisma.cheque.upsert({
              where: {
                partyId_chequeNumber: {
                  partyId: party.id,
                  chequeNumber: chequeData.chequeNumber,
                },
              },
              create: {
                date: chequeData.date,
                chequeNumber: chequeData.chequeNumber,
                amount: new Prisma.Decimal(chequeData.amount),
                status: chequeData.status,
                remarks: chequeData.remarks,
                partyId: party.id,
              },
              update: {
                date: chequeData.date,
                amount: new Prisma.Decimal(chequeData.amount),
                status: chequeData.status,
                remarks: chequeData.remarks,
              },
            });
            chequesCreated++;
          } catch (chequeError) {
            errors.push(
              `Failed to import cheque ${chequeData.chequeNumber} for ${partyData.name}: ${chequeError}`
            );
          }
        }
      } catch (partyError) {
        errors.push(
          `Failed to import party ${partyData.name}: ${partyError}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      partiesCreated,
      chequesCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import confirm error:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
