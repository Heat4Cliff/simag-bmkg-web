import assert from "node:assert/strict";
import { Given, When, Then } from "@cucumber/cucumber";
import { SimagWorld } from "../support/world";

When("pengguna membuka halaman {string}", async function (this: SimagWorld, pathName: string) {
  await this.page.goto(`${this.baseUrl}${pathName}`, { waitUntil: "domcontentloaded" });
});

When("pengguna mengisi judul laporan {string}", async function (this: SimagWorld, judul: string) {
  const input = this.page.locator('input[placeholder*="Observasi Data Curah Hujan"]');
  await input.waitFor({ state: "visible", timeout: 10_000 });
  await input.click();
  await input.fill(judul);
  if ((await input.inputValue()) !== judul) {
    await input.fill(judul);
  }
});

When("pengguna mengisi deskripsi kegiatan {string}", async function (this: SimagWorld, deskripsi: string) {
  const textarea = this.page.locator('textarea[placeholder*="Tuliskan kegiatan harian"]');
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  await textarea.click();
  await textarea.fill(deskripsi);
  if ((await textarea.inputValue()) !== deskripsi) {
    await textarea.fill(deskripsi);
  }
});

When("pengguna mengisi kendala laporan {string}", async function (this: SimagWorld, kendala: string) {
  const textarea = this.page.locator('textarea[placeholder*="Tuliskan kendala"]');
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  await textarea.click();
  await textarea.fill(kendala);
});

When("pengguna menekan tombol {string}", async function (this: SimagWorld, buttonLabel: string) {
  const btn = this.page.getByRole("button", { name: new RegExp(buttonLabel, "i") }).first();
  await btn.waitFor({ state: "visible", timeout: 10_000 });
  await btn.click();
});

Then("pengguna diarahkan kembali ke halaman {string}", async function (
  this: SimagWorld,
  expectedPath: string
) {
  await this.page.waitForURL(
    (url) => url.pathname === expectedPath,
    { timeout: 15_000, waitUntil: "domcontentloaded" }
  );
  assert.equal(new URL(this.page.url()).pathname, expectedPath);
});

Then("daftar laporan menampilkan judul {string} dengan status {string}", async function (
  this: SimagWorld,
  judul: string,
  expectedStatus: string
) {
  const itemHeading = this.page.getByRole("heading", { name: judul }).first();
  await itemHeading.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await itemHeading.isVisible(), true);

  const cardContainer = this.page.locator("a", { hasText: judul }).first();
  const cardText = await cardContainer.innerText();
  assert.ok(
    cardText.toLowerCase().includes(expectedStatus.toLowerCase()),
    `Expected card to show status "${expectedStatus}", got: "${cardText}"`
  );
});

Given("terdapat laporan harian {string} pada sistem", async function (
  this: SimagWorld,
  judul: string
) {
  await this.page.goto(`${this.baseUrl}/laporan-harian`, { waitUntil: "domcontentloaded" });
  const existing = this.page.getByRole("heading", { name: judul });
  if ((await existing.count()) === 0) {
    await this.page.goto(`${this.baseUrl}/laporan-harian/baru`, { waitUntil: "domcontentloaded" });
    await this.page.locator('input[placeholder*="Observasi Data Curah Hujan"]').fill(judul);
    await this.page
      .locator('textarea[placeholder*="Tuliskan kegiatan harian"]')
      .fill("Pengamatan rutin parameter meteorologi permukaan pada stasiun BMKG.");
    await this.page.getByRole("button", { name: /Kirim Laporan/i }).click();
    await this.page.waitForURL((url) => url.pathname === "/laporan-harian", { timeout: 15_000 });
  }
});

When("pengguna mengetik {string} pada kolom pencarian laporan", async function (
  this: SimagWorld,
  keyword: string
) {
  const searchInput = this.page.locator('input[placeholder*="Cari laporan"]');
  await searchInput.waitFor({ state: "visible", timeout: 10_000 });
  await searchInput.fill(keyword);
});

Then("daftar laporan tetap menampilkan {string}", async function (
  this: SimagWorld,
  judul: string
) {
  const heading = this.page.getByRole("heading", { name: judul }).first();
  await heading.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await heading.isVisible(), true);
});

Then(
  "tabel riwayat absensi menampilkan kolom {string}, {string}, {string}, {string}, dan {string}",
  async function (
    this: SimagWorld,
    col1: string,
    col2: string,
    col3: string,
    col4: string,
    col5: string
  ) {
    for (const col of [col1, col2, col3, col4, col5]) {
      const th = this.page.locator("th", { hasText: col }).first();
      await th.waitFor({ state: "visible", timeout: 10_000 });
      assert.equal(await th.isVisible(), true);
    }
  }
);

Then("sistem menampilkan bagian {string}", async function (
  this: SimagWorld,
  sectionTitle: string
) {
  const section = this.page.getByText(sectionTitle, { exact: false }).first();
  await section.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await section.isVisible(), true);
});
