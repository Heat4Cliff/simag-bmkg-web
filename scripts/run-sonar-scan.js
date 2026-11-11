const fs = require("fs");
const path = require("path");
const scanner = require("sonarqube-scanner").default || require("sonarqube-scanner");

const tokenPath = path.join(__dirname, "..", ".sonar-token.local");
let token = process.env.SONAR_TOKEN;

if (!token && fs.existsSync(tokenPath)) {
  token = fs.readFileSync(tokenPath, "utf8").trim();
}

if (!token) {
  console.error("ERROR: No SonarQube token found. Please set SONAR_TOKEN or create .sonar-token.local");
  process.exit(1);
}

const serverUrl = process.env.SONAR_HOST_URL || "http://127.0.0.1:9000";
const isSonarCloud = new URL(serverUrl).hostname === "sonarcloud.io";
const projectKey =
  process.env.SONAR_PROJECT_KEY ||
  (isSonarCloud ? "Heat4Cliff_simag-bmkg-web" : "simag-bmkg-web");
const organization =
  process.env.SONAR_ORGANIZATION || (isSonarCloud ? "heat4cliff" : undefined);

if (isSonarCloud && !organization) {
  console.error("ERROR: SONAR_ORGANIZATION is required for SonarQube Cloud.");
  process.exit(1);
}

const ignoredRules = [
  "S6606",
  "S3358",
  "S1128",
  "S6759",
  "S1874",
  "S3776",
  "S6479",
  "S6582",
  "S3863",
  "S1854",
  "S4325",
  "S4624",
  "S6594",
  "S6535",
];

const multicriteriaIds = [];
const multicriteriaOptions = {};

ignoredRules.forEach((rule, idx) => {
  const jsId = `js${idx + 1}`;
  const tsId = `ts${idx + 1}`;
  multicriteriaIds.push(jsId, tsId);
  multicriteriaOptions[`sonar.issue.ignore.multicriteria.${jsId}.ruleKey`] = `javascript:${rule}`;
  multicriteriaOptions[`sonar.issue.ignore.multicriteria.${jsId}.resourceKey`] = "src/**/*";
  multicriteriaOptions[`sonar.issue.ignore.multicriteria.${tsId}.ruleKey`] = `typescript:${rule}`;
  multicriteriaOptions[`sonar.issue.ignore.multicriteria.${tsId}.resourceKey`] = "src/**/*";
});

console.log(`Starting SonarQube analysis against ${serverUrl}...`);

scanner(
  {
    serverUrl,
    token,
    options: {
      "sonar.projectKey": projectKey,
      ...(organization ? { "sonar.organization": organization } : {}),
      "sonar.projectName": "SIMAG BMKG Web",
      "sonar.projectVersion": "0.1.0",
      "sonar.sources": "src",
      "sonar.tests": "tests",
      "sonar.inclusions": "src/**/*.ts,src/**/*.tsx,src/**/*.js",
      "sonar.test.inclusions": "tests/**/*.ts,tests/**/*.tsx,tests/**/*.js",
      "sonar.exclusions":
        "**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/public/**,**/coverage/**,**/*.config.ts,**/*.config.mjs,**/scripts/**,**/prisma/**",
      "sonar.javascript.lcov.reportPaths": "coverage/lcov.info",
      "sonar.cpd.exclusions": "tests/**,src/**",
      "sonar.issue.ignore.multicriteria": multicriteriaIds.join(","),
      ...multicriteriaOptions,
    },
  },
  () => {
    console.log("SonarQube analysis process completed.");
    process.exit(0);
  }
);
