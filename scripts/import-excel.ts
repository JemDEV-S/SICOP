import { resolve } from "path";
import { procesarCargaExcel } from "@/lib/ingestion/procesarCarga";
import { prisma } from "@/lib/db";

function printUsage() {
  console.log("Uso: npm run import:excel -- <archivo.xlsx> [--force] [--reset] [--usuario-id=1]");
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => !arg.startsWith("--"));

  if (!fileArg) {
    printUsage();
    process.exit(1);
  }

  const force = args.includes("--force");
  const reset = args.includes("--reset");
  const usuarioArg = args.find((arg) => arg.startsWith("--usuario-id="));
  const usuarioId = usuarioArg ? Number(usuarioArg.split("=")[1]) : undefined;

  const result = await procesarCargaExcel({
    filePath: resolve(fileArg),
    force,
    reset,
    usuarioId: Number.isFinite(usuarioId) ? usuarioId : undefined,
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
