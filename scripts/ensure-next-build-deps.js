const { spawnSync } = require("child_process");

const root = process.cwd();
const requiredPackages = [
  "typescript",
  "@types/node",
  "@types/react",
  "@types/react-dom",
];

const missingPackages = requiredPackages.filter((pkg) => {
  try {
    require.resolve(`${pkg}/package.json`, { paths: [root] });
    return false;
  } catch {
    return true;
  }
});

if (missingPackages.length === 0) {
  process.exit(0);
}

console.log("Instalando dependencias locales requeridas por Next:", missingPackages.join(", "));

const result = spawnSync(
  "npm",
  [
    "install",
    "--prefix",
    root,
    "--no-save",
    "--package-lock=false",
    ...missingPackages,
  ],
  {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
