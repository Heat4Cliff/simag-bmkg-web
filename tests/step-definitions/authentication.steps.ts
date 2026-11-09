import assert from "node:assert/strict";
import { Given, When, Then } from "@cucumber/cucumber";
import { SimagWorld } from "../support/world";
import { TEST_USERS } from "../fixtures/test-data";

Given("pengguna membuka halaman login SIMAG", async function (this: SimagWorld) {
  await this.page.goto(`${this.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await this.page.locator('button[type="submit"]').waitFor({ state: "visible" });
  await this.page.getByText("Selamat", { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
});

Given("pengguna belum login", async function (this: SimagWorld) {
  await this.context?.clearCookies();
});

Given("pengguna telah login", async function (this: SimagWorld) {
  await this.page.goto(`${this.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await this.page.getByText("Selamat", { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
  const identifierInput = this.page.locator('input[placeholder*="username"]');
  const passwordInput = this.page.locator('input[type="password"]');
  await identifierInput.click();
  await identifierInput.fill(TEST_USERS.mahasiswa.email);
  if ((await identifierInput.inputValue()) !== TEST_USERS.mahasiswa.email) {
    await identifierInput.fill(TEST_USERS.mahasiswa.email);
  }
  await passwordInput.click();
  await passwordInput.fill(TEST_USERS.mahasiswa.password);
  if ((await passwordInput.inputValue()) !== TEST_USERS.mahasiswa.password) {
    await passwordInput.fill(TEST_USERS.mahasiswa.password);
  }
  await this.page.locator('button[type="submit"]').click();
  await this.page.waitForFunction(
    () => window.location.pathname.startsWith("/dashboard"),
    undefined,
    { timeout: 15_000 }
  );
  await this.page.locator("header button[aria-label='Menu Profil Pengguna']").waitFor({ state: "visible", timeout: 10_000 });
  await this.page
    .locator("p:visible", { hasText: "Selamat datang," })
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });
});

When("pengguna memasukkan kredensial yang valid", async function (this: SimagWorld) {
  const identifierInput = this.page.locator('input[placeholder*="username"]');
  const passwordInput = this.page.locator('input[type="password"]');
  await identifierInput.click();
  await identifierInput.fill(TEST_USERS.mahasiswa.email);
  if ((await identifierInput.inputValue()) !== TEST_USERS.mahasiswa.email) {
    await identifierInput.fill(TEST_USERS.mahasiswa.email);
  }
  await passwordInput.click();
  await passwordInput.fill(TEST_USERS.mahasiswa.password);
  if ((await passwordInput.inputValue()) !== TEST_USERS.mahasiswa.password) {
    await passwordInput.fill(TEST_USERS.mahasiswa.password);
  }
});

When("pengguna memasukkan kredensial yang tidak valid", async function (this: SimagWorld) {
  const invalidEmail = "pengguna.tidak.valid@test.simag.local";
  const invalidPass = "PasswordSalah999!";
  const identifierInput = this.page.locator('input[placeholder*="username"]');
  const passwordInput = this.page.locator('input[type="password"]');
  await identifierInput.click();
  await identifierInput.fill(invalidEmail);
  if ((await identifierInput.inputValue()) !== invalidEmail) {
    await identifierInput.fill(invalidEmail);
  }
  await passwordInput.click();
  await passwordInput.fill(invalidPass);
  if ((await passwordInput.inputValue()) !== invalidPass) {
    await passwordInput.fill(invalidPass);
  }
});

When("menekan tombol login", async function (this: SimagWorld) {
  await this.page.locator('button[type="submit"]').click();
});

Then("pengguna berhasil masuk", async function (this: SimagWorld) {
  await this.page.waitForFunction(
    () => window.location.pathname.startsWith("/dashboard"),
    undefined,
    { timeout: 15_000 }
  );
  assert.match(this.page.url(), /\/dashboard/);
});

Then("dashboard ditampilkan", async function (this: SimagWorld) {
  const dashboardText = this.page.getByText("Dashboard").first();
  await dashboardText.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await dashboardText.isVisible(), true);
});

Then("sistem menolak login", async function (this: SimagWorld) {
  await this.page.waitForFunction(
    () =>
      window.location.pathname.startsWith("/login") &&
      window.location.search.includes("error=CredentialsSignin"),
    undefined,
    { timeout: 15_000 }
  );
  assert.match(this.page.url(), /\/login/);
  assert.match(this.page.url(), /error=CredentialsSignin/);
});

Then("menampilkan pesan error yang sesuai", async function (this: SimagWorld) {
  const errorToast = this.page.getByText(/Username\/Email atau password salah/i);
  await errorToast.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await errorToast.isVisible(), true);
});

When("pengguna mengakses halaman protected secara langsung", async function (this: SimagWorld) {
  await this.page.goto(`${this.baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
});

Then("sistem menolak akses atau mengarahkan pengguna ke halaman login", async function (this: SimagWorld) {
  await this.page.waitForFunction(
    () => window.location.pathname.startsWith("/login"),
    undefined,
    { timeout: 15_000 }
  );
  assert.match(this.page.url(), /\/login/);
  const submitButton = this.page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: "visible" });
  assert.equal(await submitButton.isVisible(), true);
});

When("pengguna melakukan logout", async function (this: SimagWorld) {
  // Pastikan seluruh request sesi awal pada Dashboard telah selesai sepenuhnya
  const headerProfileBtn = this.page.locator("header button[aria-label='Menu Profil Pengguna']");
  await headerProfileBtn.waitFor({ state: "visible", timeout: 10_000 });
  await this.page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

  // Klik menu profil di pojok kanan atas header
  await headerProfileBtn.click();

  const keluarBtn = this.page.getByRole("button", { name: /Keluar/i });
  await keluarBtn.waitFor({ state: "visible", timeout: 5_000 });
  await keluarBtn.click();
});

Then("session pengguna berakhir", async function (this: SimagWorld) {
  await this.page.waitForFunction(
    () => window.location.pathname.startsWith("/login"),
    undefined,
    { timeout: 15_000 }
  );
  const sessionData = await this.page.evaluate(async () => {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    return res.json();
  });
  assert.equal(sessionData, null);
});

Then("pengguna kembali ke halaman login", async function (this: SimagWorld) {
  assert.match(this.page.url(), /\/login/);
  const loginButton = this.page.getByRole("button", { name: /Masuk ke Sistem/i });
  await loginButton.waitFor({ state: "visible", timeout: 10_000 });
  assert.equal(await loginButton.isVisible(), true);
});
