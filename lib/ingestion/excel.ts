import ExcelJS from "exceljs";

export function cellValue(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) {
      return value.result;
    }
    if ("text" in value) {
      return value.text;
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }

    return undefined;
  }

  return value;
}

export function cleanText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = cleanText(value).replace(/\s/g, "").replace(/,/g, "");
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function splitCodeName(value: unknown) {
  const text = cleanText(value);
  const match = text.match(/^([^.\s]+)\.([\s\S]*)$/);

  if (!match) {
    return { codigo: text, nombre: text };
  }

  return {
    codigo: match[1].trim(),
    nombre: match[2].trim(),
  };
}

export function normalizeHeader(value: unknown) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getHeaderMap(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const headers = new Map<string, number>();

  worksheet.getRow(rowNumber).eachCell((cell, colNumber) => {
    const header = normalizeHeader(cellValue(cell.value));
    if (header) {
      headers.set(header, colNumber);
    }
  });

  return headers;
}

export function getCell(row: ExcelJS.Row, columnNumber: number | undefined) {
  return columnNumber ? cellValue(row.getCell(columnNumber).value) : undefined;
}
