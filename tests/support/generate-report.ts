import fs from "fs";
import path from "path";

interface CucumberStep {
  keyword?: string;
  hidden?: boolean;
  result?: {
    status?: string;
    duration?: number;
  };
}

interface CucumberElement {
  name: string;
  type: string;
  steps?: CucumberStep[];
}

interface CucumberFeature {
  name: string;
  uri: string;
  elements?: CucumberElement[];
}

function main() {
  const reportsDir = path.join(process.cwd(), "tests", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const cucumberJsonPath = path.join(reportsDir, "cucumber-report.json");
  let bddFeatures = 0;
  let bddScenariosTotal = 0;
  let bddScenariosPassed = 0;
  let bddScenariosFailed = 0;
  let bddStepsTotal = 0;
  let bddStepsPassed = 0;
  let bddStepsFailed = 0;
  let bddStepsSkipped = 0;

  if (fs.existsSync(cucumberJsonPath)) {
    const raw = fs.readFileSync(cucumberJsonPath, "utf-8");
    const features = JSON.parse(raw) as CucumberFeature[];
    bddFeatures = features.length;

    for (const feature of features) {
      for (const el of feature.elements ?? []) {
        if (el.type !== "scenario") continue;
        bddScenariosTotal++;
        let scenarioFailed = false;
        for (const step of el.steps ?? []) {
          if (step.hidden || step.keyword === "Before" || step.keyword === "After") {
            continue;
          }
          const status = step.result?.status ?? "unknown";
          if (status === "passed") {
            bddStepsTotal++;
            bddStepsPassed++;
          } else if (status === "failed") {
            bddStepsTotal++;
            bddStepsFailed++;
            scenarioFailed = true;
          } else if (status === "skipped" || status === "pending" || status === "undefined") {
            bddStepsTotal++;
            bddStepsSkipped++;
            scenarioFailed = true;
          }
        }
        if (scenarioFailed) {
          bddScenariosFailed++;
        } else {
          bddScenariosPassed++;
        }
      }
    }
  }

  const screenshotsDir = path.join(reportsDir, "screenshots");
  const screenshots = fs.existsSync(screenshotsDir)
    ? fs.readdirSync(screenshotsDir).filter((f) => f.endsWith(".png"))
    : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    project: "SIMAG BMKG",
    bdd: {
      features: bddFeatures,
      scenarios: {
        total: bddScenariosTotal,
        passed: bddScenariosPassed,
        failed: bddScenariosFailed,
      },
      steps: {
        total: bddStepsTotal,
        passed: bddStepsPassed,
        failed: bddStepsFailed,
        skipped: bddStepsSkipped,
      },
      reportHtml: "tests/reports/cucumber-report.html",
      reportJson: "tests/reports/cucumber-report.json",
    },
    screenshots,
  };

  const summaryPath = path.join(reportsDir, "test-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

  console.log("====================================================");
  console.log("  SIMAG BMKG — TEST EXECUTION SUMMARY REPORT");
  console.log("====================================================");
  console.log(`Generated At       : ${summary.generatedAt}`);
  console.log(`BDD Features       : ${bddFeatures}`);
  console.log(
    `BDD Scenarios      : ${bddScenariosTotal} total (${bddScenariosPassed} PASS, ${bddScenariosFailed} FAIL)`
  );
  console.log(
    `BDD Steps          : ${bddStepsTotal} total (${bddStepsPassed} PASS, ${bddStepsFailed} FAIL, ${bddStepsSkipped} SKIPPED)`
  );
  console.log(`HTML Report        : ${summary.bdd.reportHtml}`);
  console.log(`JSON Summary       : tests/reports/test-summary.json`);
  console.log(`Screenshots Saved  : ${screenshots.length} file(s)`);
  console.log("====================================================");
}

main();
