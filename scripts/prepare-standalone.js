const fs = require("fs");
const path = require("path");

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const sourceStatic = path.join(root, ".next", "static");
const targetStatic = path.join(standaloneDir, ".next", "static");
const sourcePublic = path.join(root, "public");
const targetPublic = path.join(standaloneDir, "public");

copyRequired(sourceStatic, targetStatic);
copyOptional(sourcePublic, targetPublic);

console.log("Standalone assets listos.");

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
