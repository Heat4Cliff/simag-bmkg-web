const fs = require("fs");
const path = require("path");

const reportPath = path.join(process.cwd(), "coverage", "lcov.info");
const minimumLineCoverage = 80;

if (!fs.existsSync(reportPath)) {
  console.error("Coverage report tidak ditemukan. Jalankan npm run test:coverage:lcov terlebih dahulu.");
  process.exit(1);
}

const report = fs.readFileSync(reportPath, "utf8");
let executableLines = 0;
let coveredLines = 0;
let currentFileIsCore = false;

for (const line of report.split(/\r?\n/)) {
  if (line.startsWith("SF:")) {
    currentFileIsCore = line.slice(3).replace(/\\/g, "/").includes("src/lib/");
    continue;
  }
  if (!line.startsWith("DA:")) continue;
  if (!currentFileIsCore) continue;

  const [, hitCount] = line.slice(3).split(",");
  executableLines += 1;
  if (Number(hitCount) > 0) coveredLines += 1;
}

if (executableLines === 0) {
  console.error("LCOV tidak memuat baris executable pada src/lib. Test coverage tidak berhasil dibuat.");
  process.exit(1);
}

const lineCoverage = (coveredLines / executableLines) * 100;
console.log(
  `Core LCOV line coverage: ${lineCoverage.toFixed(2)}% (${coveredLines}/${executableLines} src/lib lines). Target: >= ${minimumLineCoverage}%.`
);

if (lineCoverage < minimumLineCoverage) {
  console.error("Coverage belum mencapai target. Tambahkan test pada jalur yang belum tercakup.");
  process.exit(1);
}
