const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const { expect } = require("chai");
const TestHelpers = require("../../support/helpers");

let helpers;

// ========== HOOKS ==========
Before({ tags: "@ui and @clientes", timeout: 90000 }, async function () {
  console.log("🔄 Iniciando navegador para teste de clientes...");
  helpers = new TestHelpers();
  await helpers.initBrowser();
  console.log("✅ Navegador iniciado!");
});

After({ tags: "@ui and @clientes" }, async function () {
  await helpers.closeBrowser();
});

// ========== DADO (GIVEN) ==========
Given("que o usuário esteja autenticado no sistema", async function () {
  // Navega para página de login
  await helpers.navigateTo("/");

  // Faz login
  await helpers.type('input[placeholder="Usuário"]', "adm@email.com");
  await helpers.type('input[type="password"]', "123456");
  await helpers.click(".login-box button");

  // Aguarda redirecionamento para dashboard
  await helpers.waitForUrlContains("/dashboard");
  console.log("✅ Usuário autenticado com sucesso!");
});

Given("esteja na tela de cadastro de clientes", async function () {
  // Navega para a tela de clientes pelo menu (botão no sidebar)
  await helpers.clickByText("Clientes");
  await helpers.waitForUrlContains("/clientes");

  // Verifica se está na página correta
  const titulo = await helpers.getText("h1");
  expect(titulo).to.equal("Clientes");
  console.log("✅ Navegou para tela de clientes!");
});

// ========== QUANDO (WHEN) ==========
When("o usuário clicar no botão {string}", async function (botao) {
  if (botao === "Novo Cliente") {
    await helpers.click(".btn-adicionar");
    console.log("✅ Clicou no botão Novo Cliente!");
  }
});

When("preencher o campo {string} com {string}", async function (campo, valor) {
  const selector = `input[name="${campo}"]`;
  await helpers.type(selector, valor);
  console.log(`✅ Preencheu campo ${campo} com: ${valor}`);
});

When("clicar no botão {string}", async function (botao) {
  if (botao === "Salvar") {
    await helpers.click(".btn-confirmar");
    console.log("✅ Clicou no botão Salvar!");
  } else if (botao === "Cancelar") {
    await helpers.click(".btn-cancelar");
    console.log("✅ Clicou no botão Cancelar!");
  }
});

// ========== ENTÃO (THEN) ==========
Then("o sistema deve exibir a mensagem {string}", async function (mensagem) {
  // Aguarda e verifica mensagem de sucesso
  const texto = await helpers.getText(".mensagem-sucesso");
  expect(texto).to.include(mensagem);
  console.log(`✅ Mensagem exibida: ${mensagem}`);
});

Then(
  "o cliente {string} deve ser exibido na listagem de clientes",
  async function (nomeCliente) {
    // Aguarda a tabela carregar e verifica se o cliente aparece
    await helpers.waitForElement(".usuarios-tabela");

    // Busca o nome na tabela
    const tabela = await helpers.getText(".usuarios-tabela");
    expect(tabela).to.include(nomeCliente);
    console.log(`✅ Cliente ${nomeCliente} encontrado na listagem!`);
  }
);
