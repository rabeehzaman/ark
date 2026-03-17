import { format, parse, isValid } from "date-fns";

/**
 * Parse dates from Excel with various formats:
 * - DD/MM/YY, DD/MM/YYYY
 * - YYYY-MM-DD HH:MM:SS (Excel datetime)
 * - DD/MM (no year - assume current year)
 * - 19`1`26 (backticks instead of slashes)
 * - Multiple dates in one cell: "14/10/24,13/1/25,11/3/2025" - use last date
 * - Leading/trailing spaces
 */
export function parseExcelDate(value: unknown): Date | null {
  if (!value) return null;

  // Handle Excel serial number dates
  if (typeof value === "number") {
    // Excel serial date: days since 1900-01-01 (with the 1900 leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (isValid(date) && date.getFullYear() > 1990) return date;
    return null;
  }

  let str = String(value).trim();
  if (!str || str.replace(/\s/g, "") === "") return null;

  // Replace backticks with slashes
  str = str.replace(/`/g, "/");

  // If multiple dates separated by comma, use the last one
  if (str.includes(",")) {
    const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
    str = parts[parts.length - 1];
  }

  // Try YYYY-MM-DD HH:MM:SS format (Excel datetime)
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(str);
    if (isValid(d)) return d;
  }

  // Try DD/MM/YYYY
  const fullMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fullMatch) {
    const [, day, month, year] = fullMatch;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(d)) return d;
  }

  // Try DD/MM/YY
  const shortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortMatch) {
    const [, day, month, year] = shortMatch;
    const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
    const d = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    if (isValid(d)) return d;
  }

  // Try DD/MM (no year - assume current year)
  const noYearMatch = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (noYearMatch) {
    const [, day, month] = noYearMatch;
    const d = new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day));
    if (isValid(d)) return d;
  }

  // Last resort: try native Date parsing
  const lastResort = new Date(str);
  if (isValid(lastResort) && lastResort.getFullYear() > 1990) return lastResort;

  return null;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "\u2014";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "\u2014";
  return format(d, "dd/MM/yyyy");
}
