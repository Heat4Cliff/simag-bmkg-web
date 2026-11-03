import assert from "node:assert/strict";
import { When, Then } from "@cucumber/cucumber";
import { SimagWorld } from "../support/world";
import { TEST_USERS } from "../fixtures/test-data";

When("pengguna berada di halaman dashboard", async function (this: SimagWorld) {
  if (!this.page.url().includes("/dashboard")) {
    await this.page.goto(`${this.baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  }
  await this.page
    .locator("p:visible", { hasText: "Selamat datang," })
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });
});

Then("pengguna melihat kartu statistik {string}", async function (this: SimagWorld, cardLabel: string) {
  const card = this.page.locator(":visible", { hasText: cardLabel }).first();
  await card.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await card.isVisible(), true);
});

Then("sistem menampilkan sapaan {string} beserta nama pengguna", async function (this: SimagWorld, greeting: string) {
  const greetingLocator = this.page.locator("p:visible", { hasText: greeting }).first();
  await greetingLocator.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await greetingLocator.isVisible(), true);

  const nameLocator = this.page.locator(":visible", { hasText: TEST_USERS.mahasiswa.nama }).first();
  await nameLocator.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await nameLocator.isVisible(), true);
});

Then("sistem menampilkan indikator {string} beserta tautan {string}", async function (
  this: SimagWorld,
  progressLabel: string,
  linkLabel: string
) {
  const progress = this.page.locator(":visible", { hasText: progressLabel }).first();
  await progress.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await progress.isVisible(), true);

  const link = this.page.locator("a:visible", { hasText: new RegExp(linkLabel, "i") }).first();
  await link.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await link.isVisible(), true);
});

When("pengguna menekan kartu statistik {string} di dashboard", async function (
  this: SimagWorld,
  cardLabel: string
) {
  const cardLink = this.page.locator("a", { hasText: cardLabel }).first();
  await cardLink.waitFor({ state: "visible", timeout: 10_000 });
  await cardLink.click();
});

Then("pengguna diarahkan ke halaman {string}", async function (this: SimagWorld, expectedPath: string) {
  await this.page.waitForURL(`**${expectedPath}*`, {
    timeout: 15_000,
    waitUntil: "domcontentloaded",
  });
  assert.ok(this.page.url().includes(expectedPath));
});

Then("judul halaman menampilkan {string}", async function (this: SimagWorld, headingText: string) {
  const heading = this.page.getByRole("heading", { name: new RegExp(headingText, "i") }).first();
  await heading.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await heading.isVisible(), true);
});
