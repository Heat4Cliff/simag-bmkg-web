import assert from "node:assert/strict";
import { Then } from "@cucumber/cucumber";
import { SimagWorld } from "../support/world";
import { TEST_USERS } from "../fixtures/test-data";

Then("sistem menampilkan judul {string}", async function (
  this: SimagWorld,
  expectedTitle: string
) {
  const heading = this.page.getByText(expectedTitle, { exact: false }).first();
  await heading.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await heading.isVisible(), true);
});

Then("formulir profil menampilkan nama pengguna yang sesuai", async function (this: SimagWorld) {
  const nameElement = this.page.getByText(TEST_USERS.mahasiswa.nama, { exact: false }).first();
  await nameElement.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await nameElement.isVisible(), true);
});

Then("formulir profil menampilkan email pengguna yang sesuai", async function (this: SimagWorld) {
  const emailElement = this.page.getByText(TEST_USERS.mahasiswa.email, { exact: false }).first();
  await emailElement.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await emailElement.isVisible(), true);
});

Then("halaman pengaturan menampilkan informasi instansi", async function (this: SimagWorld) {
  const settingElement = this.page.getByText("Pengaturan", { exact: false }).first();
  await settingElement.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await settingElement.isVisible(), true);
});
