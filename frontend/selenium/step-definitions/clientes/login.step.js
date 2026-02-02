const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const { expect } = require("chai");
const TestHelpers = require("../../support/helpers");

let helpers;

Before({ tags: "@ui", timeout: 90000 }, async function () {
  console.log("🔄 Iniciando navegador...");
  helpers = new TestHelpers();
  await helpers.initBrowser();
  console.log("✅ Navegador iniciado!");
});

After("@ui", async function () {
  await helpers.closeBrowser();
});

// ========== DADO ==========
Given("que estou na página de login", async function () {
  await helpers.navigateTo("/");
});

// ========== QUANDO ==========
When("preencho o email {string}", async function (email) {
  await helpers.type('input[placeholder="Usuário"]', email);
});

When("preencho a senha {string}", async function (senha) {
  await helpers.type('input[type="password"]', senha);
});

When("clico no botão entrar", async function () {
  await helpers.click(".login-box button");
});

// ========== ENTÃO ==========
Then("devo ser redirecionado para {string}", async function (url) {
  await helpers.waitForUrlContains(url);
  const currentUrl = await helpers.getCurrentUrl();
  expect(currentUrl).to.include(url);
});

Then("devo ver a mensagem de erro {string}", async function (mensagem) {
  const texto = await helpers.getText(".login-error");
  expect(texto).to.include(mensagem);
});
