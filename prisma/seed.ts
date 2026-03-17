import "dotenv/config";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function parseExcelDate(value: unknown): Date | null {
  if (!value) return null;

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1990) return date;
    return null;
  }

  let str = String(value).trim();
  if (!str || str.replace(/\s/g, "") === "") return null;

  str = str.replace(/`/g, "/");

  if (str.includes(",")) {
    const parts = str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    str = parts[parts.length - 1];
  }

  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  const fullMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fullMatch) {
    const [, day, month, year] = fullMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const shortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortMatch) {
    const [, day, month, year] = shortMatch;
    const fullYear =
      parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }

  const noYearMatch = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (noYearMatch) {
    const [, day, month] = noYearMatch;
    return new Date(
      new Date().getFullYear(),
      parseInt(month) - 1,
      parseInt(day)
    );
  }

  const lastResort = new Date(str);
  if (!isNaN(lastResort.getTime()) && lastResort.getFullYear() > 1990)
    return lastResort;

  return null;
}

function normalizeStatus(
  cleared: unknown,
  bounced: unknown
): "PENDING" | "CLEARED" | "BOUNCED" {
  const clearedStr = String(cleared ?? "")
    .trim()
    .toLowerCase();
  const bouncedStr = String(bounced ?? "")
    .trim()
    .toLowerCase();

  const isCleared =
    clearedStr.startsWith("clear") || clearedStr === "cleared";
  const isBounced =
    bouncedStr.startsWith("bounce") || bouncedStr === "bounced";

  if (isCleared && isBounced) return "CLEARED";
  if (isCleared) return "CLEARED";
  if (isBounced) return "BOUNCED";
  return "PENDING";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

const SKIP_SHEETS = ["Sheet46", "Sheet49", "TOTAL DETAIL OF CHEQUES"];

async function main() {
  console.log("Starting seed...");

  const filePath = path.join(process.cwd(), "ARK CHEQUE BOOK.xlsx");
  if (!fs.existsSync(filePath)) {
    console.error("Excel file not found at:", filePath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const client = await pool.connect();
  let totalParties = 0;
  let totalCheques = 0;

  try {
    for (const sheetName of workbook.SheetNames) {
      if (SKIP_SHEETS.includes(sheetName)) continue;

      const sheet = workbook.Sheets[sheetName];
      const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        blankrows: true,
      });

      if (!rawData || rawData.length < 4) continue;

      // Extract party name from A1
      const cellA1 = rawData[0]?.[0];
      let partyName = String(cellA1 ?? "").trim();
      partyName = partyName.replace(/^\d+\.?\s*/, "").trim();
      partyName = partyName.split(/TOTAL\s*CHEQUE/i)[0].trim();
      if (!partyName) partyName = sheetName;

      const slug = slugify(partyName);

      // Upsert party
      const partyResult = await client.query(
        `INSERT INTO "Party" (id, name, slug, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET "updatedAt" = NOW()
         RETURNING id`,
        [generateCuid(), partyName, slug]
      );
      const partyId = partyResult.rows[0].id;
      totalParties++;
      console.log(`Party: ${partyName} (${slug})`);

      // Parse cheques starting from row 4 (index 3)
      for (let i = 3; i < rawData.length; i++) {
        const row = rawData[i];
        if (
          !row ||
          row.every(
            (cell) =>
              cell === null ||
              cell === undefined ||
              String(cell).trim() === ""
          )
        )
          continue;

        const chequeNum = String(row[1] ?? "").trim();
        const amountStr = String(row[2] ?? "").trim();

        if (!chequeNum && !amountStr) continue;
        if (!amountStr || isNaN(parseFloat(amountStr))) continue;

        const amount = parseFloat(amountStr);
        if (amount <= 0) continue;

        const chequeNumber = chequeNum || `UNKNOWN-${i}`;
        const date = parseExcelDate(row[0]);
        const status = normalizeStatus(row[3], row[4]);
        const remarks = row[5] ? String(row[5]).trim() || null : null;

        try {
          await client.query(
            `INSERT INTO "Cheque" (id, date, "chequeNumber", amount, status, remarks, "partyId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5::\"ChequeStatus\", $6, $7, NOW(), NOW())
             ON CONFLICT ("partyId", "chequeNumber") DO UPDATE SET
               date = EXCLUDED.date,
               amount = EXCLUDED.amount,
               status = EXCLUDED.status,
               remarks = EXCLUDED.remarks,
               "updatedAt" = NOW()`,
            [generateCuid(), date, chequeNumber, amount, status, remarks, partyId]
          );
          totalCheques++;
        } catch (err) {
          console.error(`  Error importing cheque ${chequeNumber}:`, err);
        }
      }
    }
  } finally {
    client.release();
  }

  console.log(
    `\nSeed complete! ${totalParties} parties, ${totalCheques} cheques imported.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
