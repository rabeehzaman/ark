import * as XLSX from "xlsx";
import { parseExcelDate } from "../date-utils";

export interface ParsedCheque {
  date: Date | null;
  chequeNumber: string;
  amount: number;
  status: "PENDING" | "CLEARED" | "BOUNCED";
  remarks: string | null;
}

export interface ParsedParty {
  name: string;
  cheques: ParsedCheque[];
  totalAmount: number;
  bouncedTotal: number;
}

const SKIP_SHEETS = ["Sheet46", "Sheet49", "TOTAL DETAIL OF CHEQUES"];

function normalizeStatus(cleared: unknown, bounced: unknown): "PENDING" | "CLEARED" | "BOUNCED" {
  const clearedStr = String(cleared ?? "").trim().toLowerCase();
  const bouncedStr = String(bounced ?? "").trim().toLowerCase();

  // If both cleared and bounced are present, final state is CLEARED (resubmission)
  const isCleared = clearedStr.startsWith("clear") || clearedStr === "cleared";
  const isBounced = bouncedStr.startsWith("bounce") || bouncedStr === "bounced";

  if (isCleared && isBounced) return "CLEARED";
  if (isCleared) return "CLEARED";
  if (isBounced) return "BOUNCED";
  return "PENDING";
}

function extractPartyName(sheet: XLSX.WorkSheet): string {
  const cell = sheet["A1"];
  if (!cell) return "";
  let name = String(cell.v ?? "").trim();
  // Strip numbering prefix like "2. ", "4.", "16. ", "50 "
  name = name.replace(/^\d+\.?\s*/, "").trim();
  // Also remove "TOTAL CHEQUE TO BE PRESENTED" if concatenated
  name = name.split(/TOTAL\s*CHEQUE/i)[0].trim();
  return name;
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => {
    if (cell === null || cell === undefined) return true;
    return String(cell).trim() === "";
  });
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedParty[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const parties: ParsedParty[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (SKIP_SHEETS.includes(sheetName)) continue;

    const sheet = workbook.Sheets[sheetName];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: true,
    });

    if (!rawData || rawData.length < 4) continue;

    const partyName = extractPartyName(sheet) || sheetName;
    const cheques: ParsedCheque[] = [];

    // Data starts at row 4 (index 3)
    for (let i = 3; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || isRowEmpty(row)) continue;

      // Column mapping: A=Date, B=ChequeNumber, C=Amount, D=Cleared, E=Bounced, F=Remarks
      const dateVal = row[0];
      const chequeNum = row[1];
      const amountVal = row[2];
      const clearedVal = row[3];
      const bouncedVal = row[4];
      const remarksVal = row[5];

      // Skip if no cheque number and no amount
      const chequeStr = String(chequeNum ?? "").trim();
      const amountStr = String(amountVal ?? "").trim();

      if (!chequeStr && !amountStr) continue;
      if (!amountStr || isNaN(parseFloat(amountStr))) continue;

      const amount = parseFloat(amountStr);
      if (amount <= 0) continue;

      cheques.push({
        date: parseExcelDate(dateVal),
        chequeNumber: chequeStr || `UNKNOWN-${i}`,
        amount,
        status: normalizeStatus(clearedVal, bouncedVal),
        remarks: remarksVal ? String(remarksVal).trim() || null : null,
      });
    }

    if (cheques.length === 0 && partyName) {
      // Still add the party even if no cheques (headers only sheets)
      parties.push({
        name: partyName,
        cheques: [],
        totalAmount: 0,
        bouncedTotal: 0,
      });
      continue;
    }

    if (cheques.length > 0) {
      const totalAmount = cheques.reduce((sum, c) => sum + c.amount, 0);
      const bouncedTotal = cheques
        .filter((c) => c.status === "BOUNCED")
        .reduce((sum, c) => sum + c.amount, 0);

      parties.push({
        name: partyName,
        cheques,
        totalAmount,
        bouncedTotal,
      });
    }
  }

  return parties;
}
