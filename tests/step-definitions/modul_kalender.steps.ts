import assert from "node:assert/strict";
import { Then } from "@cucumber/cucumber";
import { SimagWorld } from "../support/world";

Then("judul atau breadcrumb modul menampilkan {string}", async function (
  this: SimagWorld,
  expectedText: string
) {
  const locator = this.page.locator(`text="${expectedText}"`).first();
  await locator.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await locator.isVisible(), true);
});

Then("sistem menampilkan tombol {string}", async function (
  this: SimagWorld,
  buttonLabel: string
) {
  const btn = this.page.locator(`a:has-text("${buttonLabel}"), button:has-text("${buttonLabel}")`).first();
  await btn.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await btn.isVisible(), true);
});

Then("sistem menampilkan input judul modul", async function (this: SimagWorld) {
  const input = this.page.locator('input[placeholder*="Modul"], input[name="judul"], input[id="judul"]').first();
  await input.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await input.isVisible(), true);
});

Then("sistem menampilkan pilihan kategori modul", async function (this: SimagWorld) {
  const select = this.page.locator("select").first();
  await select.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await select.isVisible(), true);
});

Then("sistem menampilkan textarea konten modul", async function (this: SimagWorld) {
  const textarea = this.page.locator("textarea").first();
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await textarea.isVisible(), true);
});

Then("sistem menampilkan header kalender dengan navigasi bulan", async function (this: SimagWorld) {
  const navBtn = this.page.locator('button:has(svg.lucide-chevron-left), button:has(svg.lucide-chevron-right)').first();
  await navBtn.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await navBtn.isVisible(), true);
});
