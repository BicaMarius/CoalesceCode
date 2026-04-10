#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const benchmarkRoot = path.join(repoRoot, "docs", "benchmarks");

  const filesToDelete = [
    path.join(benchmarkRoot, "latest.json"),
    path.join(benchmarkRoot, "latest-summary.md"),
    path.join(benchmarkRoot, "latest-git-tests.json"),
    path.join(benchmarkRoot, "latest-git-tests.md"),
    path.join(benchmarkRoot, "latest-zip-tests.json"),
    path.join(benchmarkRoot, "latest-zip-tests.md"),
    path.join(benchmarkRoot, "comparison-latest.md"),
    path.join(benchmarkRoot, "results.latest.json"),
  ];

  filesToDelete.forEach(removeIfExists);

  const resultsDir = path.join(benchmarkRoot, "results");
  if (fs.existsSync(resultsDir)) {
    fs.readdirSync(resultsDir)
      .filter((name) => /\.json$/i.test(name))
      .forEach((name) => removeIfExists(path.join(resultsDir, name)));
  }

  console.log("[benchmark] Cleaned benchmark result outputs.");
}

main();
