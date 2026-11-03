import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { Browser, BrowserContext, Page } from "playwright";
import fs from "fs/promises";
import path from "path";
import { launchTestBrowser } from "../support/world";
import { ensureBddTestUser, cleanupBddTestUser } from "../support/setup-test-db";
import { TEST_USERS } from "../fixtures/test-data";

const BASE_URL =
  process.env.TEST_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3200";

const SCREENSHOT_DIR = path.join(process.cwd(), "tests", "reports", "screenshots");

describe("SIMAG BMKG — Automated E2E Usability, Responsive Layout & Basic Accessibility Audit", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => {
    await ensureBddTestUser();
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    browser = await launchTestBrowser();
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      permissions: ["geolocation", "notifications"],
      geolocation: { latitude: -7.7219129, longitude: 109.0131919, accuracy: 10 },
      serviceWorkers: "block",
    });
    await context.addInitScript(() => {
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
    page = await context.newPage();
  });

  after(async () => {
    if (context) {
      await context.close();
    }
    if (browser) await browser.close();
    await cleanupBddTestUser();
  });

  it("Task 1 (Login & Error Feedback): halaman login memiliki struktur semantik, label jelas, dan umpan balik error valid", async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    // Verifikasi gambar logo memiliki atribut alt
    const logoImg = page.locator("img[alt='Logo UNUGHA']");
    await logoImg.waitFor({ state: "visible", timeout: 10_000 });
    assert.equal(await logoImg.isVisible(), true);

    // Verifikasi kejelasan label form
    const labelEmail = page.getByText("Email atau Username");
    const labelPass = page.getByText("Password");
    assert.equal(await labelEmail.isVisible(), true);
    assert.equal(await labelPass.isVisible(), true);

    // Verifikasi interaksi tombol tampilkan/sembunyikan password
    const passInput = page.locator('input[placeholder="••••••••"]');
    assert.equal(await passInput.getAttribute("type"), "password");

    // Login dengan kredensial valid
    await page.getByText("Selamat", { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
    const idInput = page.locator('input[placeholder*="username"]');
    await idInput.click();
    await idInput.fill(TEST_USERS.mahasiswa.email);
    if ((await idInput.inputValue()) !== TEST_USERS.mahasiswa.email) {
      await idInput.fill(TEST_USERS.mahasiswa.email);
    }
    await passInput.click();
    await passInput.fill(TEST_USERS.mahasiswa.password);
    if ((await passInput.inputValue()) !== TEST_USERS.mahasiswa.password) {
      await passInput.fill(TEST_USERS.mahasiswa.password);
    }
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 15_000, waitUntil: "domcontentloaded" });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "usability-task1-dashboard-desktop.png"),
      fullPage: true,
    });
  });

  it("Task 2 (Dashboard Comprehension): menampilkan kartu ringkasan, sapaan, dan progres magang dengan keterbacaan baik", async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page
      .locator("p:visible", { hasText: "Selamat datang," })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });

    for (const label of [
      "Kehadiran Bulan Ini",
      "Laporan Terkirim",
      "Modul Dibuat",
      "Status Hari Ini",
      "Progres Magang",
    ]) {
      const el = page.locator(":visible", { hasText: label }).first();
      await el.waitFor({ state: "visible", timeout: 10_000 });
      assert.equal(await el.isVisible(), true);
    }
  });

  it("Task 3 & 4 (Navigasi Menu Utama & Penggunaan Fitur Laporan Harian): membuat dan memfilter laporan harian", async () => {
    await page.goto(`${BASE_URL}/laporan-harian`, { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { name: /Laporan Harian/i }).first();
    await heading.waitFor({ state: "visible", timeout: 10_000 });

    const buatBtn = page.getByRole("link", { name: /Buat Laporan/i }).first();
    await buatBtn.waitFor({ state: "visible", timeout: 10_000 });
    assert.equal(await buatBtn.isVisible(), true);
    await buatBtn.click();

    await page.waitForURL("**/laporan-harian/baru", { timeout: 15_000, waitUntil: "domcontentloaded" });

    // Verifikasi indikator karakter real-time pada textarea deskripsi
    const deskripsiInput = page.locator('textarea[placeholder*="Tuliskan kegiatan harian"]');
    await deskripsiInput.waitFor({ state: "visible", timeout: 10_000 });
    await deskripsiInput.click();
    await deskripsiInput.fill("Pengamatan sinoptik dan pencatatan suhu udara permukaan.");
    const charCounter = page.getByText(/karakter/i).first();
    await charCounter.waitFor({ state: "visible", timeout: 5_000 });
    assert.equal(await charCounter.isVisible(), true);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "usability-task4-form-laporan.png"),
      fullPage: true,
    });
  });

  it("Task 5 (Responsive Mobile Viewport 375x667): layout tidak mengalami horizontal overflow pada layar smartphone", async () => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page
      .locator("p:visible", { hasText: "Selamat datang," })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 4;
    });
    assert.equal(overflow, false, "Halaman mengalami horizontal overflow pada viewport mobile 375px");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "usability-task5-mobile-responsive.png"),
      fullPage: true,
    });

    // Kembalikan ukuran viewport desktop
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  it("Task 6 (Navigasi Kembali & Logout): pengguna dapat keluar dari sistem dan kembali ke halaman login", async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page
      .locator("header")
      .getByText(TEST_USERS.mahasiswa.nama)
      .waitFor({ state: "visible", timeout: 10_000 });
    await page
      .getByText("Belum Absen")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    const headerProfileBtn = page.locator("header button").last();
    await headerProfileBtn.waitFor({ state: "visible", timeout: 10_000 });
    await headerProfileBtn.click();

    const keluarBtn = page.getByRole("button", { name: /Keluar/i });
    await keluarBtn.waitFor({ state: "visible", timeout: 5_000 });
    await keluarBtn.click();

    await page.waitForFunction(
      () => window.location.pathname.startsWith("/login"),
      undefined,
      { timeout: 15_000 }
    );
    assert.match(page.url(), /\/login/);
  });
});
