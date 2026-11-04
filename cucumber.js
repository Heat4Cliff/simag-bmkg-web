module.exports = {
  default: {
    paths: ["tests/features/**/*.feature"],
    require: [
      "tests/support/world.ts",
      "tests/support/hooks.ts",
      "tests/step-definitions/**/*.ts",
    ],
    format: [
      "summary",
      "json:tests/reports/cucumber-report.json",
      "html:tests/reports/cucumber-report.html",
    ],
  },
};
