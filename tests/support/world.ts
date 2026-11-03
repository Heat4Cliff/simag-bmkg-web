import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page, chromium } from "playwright";
import fs from "fs";

const CANDIDATE_CHROMIUM_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/home/heathcliff/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean) as string[];

export function resolveChromiumExecutablePath(): string | undefined {
  for (const candidate of CANDIDATE_CHROMIUM_PATHS) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export class SimagWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page!: Page;
  baseUrl: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl =
      process.env.TEST_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3200";
  }

  async initBrowser(sharedBrowser: Browser) {
    this.browser = sharedBrowser;
    this.context = await sharedBrowser.newContext({
      viewport: { width: 1280, height: 800 },
      permissions: ["geolocation", "notifications"],
      geolocation: { latitude: -7.7219129, longitude: 109.0131919, accuracy: 10 },
      serviceWorkers: "block",
    });
    await this.context.addInitScript(() => {
      try {
        sessionStorage.setItem(
          "simag_last_known_geo",
          JSON.stringify({
            lat: -7.7219129,
            lon: 109.0131919,
            accuracy: 10,
            timestamp: Date.now(),
          })
        );
      } catch {}
    });
    this.page = await this.context.newPage();
  }

  async closeContext() {
    if (this.context) {
      await this.context.close();
    }
  }
}

try {
  setWorldConstructor(SimagWorld);
} catch {
  // Imported outside Cucumber runner (e.g. Node --test E2E runner)
}

export async function launchTestBrowser(): Promise<Browser> {
  const executablePath = resolveChromiumExecutablePath();
  return chromium.launch({
    headless: process.env.HEADLESS !== "false",
    ...(executablePath ? { executablePath } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--host-resolver-rules=MAP simag.alwanabbas.my.id 104.21.90.124",
    ],
  });
}
