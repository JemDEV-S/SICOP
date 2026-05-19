const fs = require("fs");
const path = require("path");

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const sourceStatic = path.join(root, ".next", "static");
const targetStatic = path.join(standaloneDir, ".next", "static");
const sourcePublic = path.join(root, "public");
const targetPublic = path.join(standaloneDir, "public");
const sourcePrisma = findPrismaDir();
const targetPrisma = path.join(standaloneDir, "node_modules", ".prisma");

copyRequired(sourceStatic, targetStatic);
copyOptional(sourcePublic, targetPublic);
copyOptional(sourcePrisma, targetPrisma);
copyPrismaEngine();

console.log("Standalone assets listos.");

function findPrismaDir() {
  const candidates = [path.join(root, "node_modules", ".prisma")];

  try {
    const generatedClientPkg = require.resolve(".prisma/client/package.json");
    candidates.push(path.dirname(path.dirname(generatedClientPkg)));
  } catch {}

  try {
    const clientPkg = require.resolve("@prisma/client/package.json");
    candidates.push(path.join(path.dirname(path.dirname(clientPkg)), ".prisma"));
  } catch {}

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function copyOptional(source, target) {
  if (source && fs.existsSync(source)) {
    copyDir(source, target);
  }
}

// Copies only the Prisma Node-API library engine into the standalone bundle.
// Keeping the binary query-engine around can make cPanel count extra LVE tasks.
function copyPrismaEngine() {
  let enginesDir;
  try {
    enginesDir = path.dirname(require.resolve("@prisma/engines/package.json"));
  } catch {
    console.warn("  @prisma/engines no encontrado, se omite copia del engine.");
    return;
  }

  const engineFiles = fs.readdirSync(enginesDir).filter(isPrismaLibraryEngine);

  if (engineFiles.length === 0) {
    console.warn("  No se encontro el engine library de Prisma en", enginesDir);
    return;
  }

  const targetDir = path.join(standaloneDir, "node_modules", ".prisma", "client");
  fs.mkdirSync(targetDir, { recursive: true });
  removePrismaBinaryEngines(targetDir);

  for (const file of engineFiles) {
    fs.copyFileSync(path.join(enginesDir, file), path.join(targetDir, file));
    console.log(`  Engine copiado: ${file}`);
  }
}

function isPrismaLibraryEngine(file) {
  return (
    file.includes("query_engine") &&
    (file.endsWith(".so.node") || file.endsWith(".dll.node") || file.endsWith(".dylib.node"))
  );
}

function removePrismaBinaryEngines(targetDir) {
  for (const file of fs.readdirSync(targetDir)) {
    if (file.startsWith("query-engine") && !file.endsWith(".node")) {
      fs.rmSync(path.join(targetDir, file), { force: true });
      console.log(`  Engine binario removido: ${file}`);
    }
  }
}

function copyRequired(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`No existe ${path.relative(root, source)}. Ejecuta next build antes de preparar standalone.`);
  }
  copyDir(source, target);
}

function copyDir(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}
