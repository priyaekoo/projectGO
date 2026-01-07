/// <reference types="cypress" />

describe("Login E2E Tests", () => {
  let auth;

  beforeEach(() => {
    cy.fixture("auth").then((authData) => {
      auth = authData;
    });

    cy.visit("/login"); // usa baseUrl do Cypress
  });

  it("CT01 - Login com Sucesso", () => {
    cy.login(auth.loginValido.usuario, auth.loginValido.senha);

    cy.url().should("include", "/usuarios");
  });

  it("CT02 - Login Inválido", () => {
    cy.loginInvalido(
      auth.loginSenhaInvalida.usuario,
      auth.loginSenhaInvalida.senha
    );

    cy.get(".login-error").should("be.visible", "Usuário ou senha inválidos");
  });
});
