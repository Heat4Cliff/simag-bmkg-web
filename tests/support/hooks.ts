import {
  BeforeAll,
  AfterAll,
  Before,
  After,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import { Browser } from "playwright";
import fs from "fs/promises";
import path from "path";
import { SimagWorld, launchTestBrowser } from "./world";
import { ensureBddTestUser, cleanupBddTestUser } from "./setup-test-db";

setDefaultTimeout(30_000);

let sharedBrowser: Browser;

BeforeAll(async function () {
  await ensureBddTestUser();
  await fs.mkdir(path.join(process.cwd(), "tests", "reports", "screenshots"), {
    recursive: true,
  });
  sharedBrowser = await launchTestBrowser();
});

Before(async function (this: SimagWorld) {
  await this.initBrowser(sharedBrowser);
});

After(async function (this: SimagWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const safeName = scenario.pickle.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const screenshotPath = path.join(
      process.cwd(),
      "tests",
      "reports",
      "screenshots",
      `failed-${safeName}-${Date.now()}.png`
    );
    const buffer = await this.page.screenshot({ fullPage: true });
    await fs.writeFile(screenshotPath, buffer);
    this.attach(buffer, "image/png");
  }
  await this.closeContext();
});

AfterAll(async function () {
  if (sharedBrowser) {
    await sharedBrowser.close();
  }
  await cleanupBddTestUser();
});
