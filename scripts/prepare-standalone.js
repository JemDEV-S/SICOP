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

console.log("Standalone assets listos.");

// Resolves .prisma regardless of whether packages live in local node_modules or nodevenv
function findPrismaDir() {
  try {
    const clientPkg = require.resolve("@prisma/client/package.json");
    return path.join(path.dirname(path.dirname(clientPkg)), ".prisma");
  } catch {
    return path.join(root, "node_modules", ".prisma");
  }
}

function copyRequired(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`No existe ${path.relative(root, source)}. Ejecuta next build antes de preparar standalone.`);
  }
  copyDir(source, target);
}

function copyOptional(source, target) {
  if (fs.existsSync(source)) {
    copyDir(source, target);
  }
}

function copyDir(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}
