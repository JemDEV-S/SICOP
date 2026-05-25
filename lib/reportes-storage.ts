import { existsSync } from "fs";
import { mkdir, readFile, stat } from "fs/promises";
import { basename, dirname, join, resolve } from "path";

const REPORTES_DIR = "reportes";

export function getProjectRoot() {
  const cwd = process.cwd();
  if (basename(cwd) === "standalone" && basename(dirname(cwd)) === ".next") {
    return resolve(cwd, "..", "..");
  }
  return cwd;
}

export function getReportesUploadDir() {
  return process.env.REPORTES_UPLOAD_DIR || join(getProjectRoot(), "uploads", REPORTES_DIR);
}

export async function ensureReportesUploadDir() {
  const dir = getReportesUploadDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export function sanitizePdfName(name: string) {
  return name
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();
}

export function getReportesLookupDirs() {
  const root = getProjectRoot();
  const cwd = process.cwd();
  return Array.from(
    new Set([
      getReportesUploadDir(),
      join(root, "public", "uploads", REPORTES_DIR),
      join(cwd, "public", "uploads", REPORTES_DIR),
    ]),
  );
}

export async function readReportePdf(filename: string) {
  const safeFilename = basename(filename);
  if (!/^[a-zA-Z0-9._-]+\.pdf$/i.test(safeFilename)) return null;

  for (const dir of getReportesLookupDirs()) {
    const filePath = join(dir, safeFilename);
    if (!existsSync(filePath)) continue;
    const info = await stat(filePath);
    if (!info.isFile()) continue;
    return { buffer: await readFile(filePath), size: info.size, filePath };
  }

  return null;
}
