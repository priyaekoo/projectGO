/// <reference types="cypress" />

Cypress.Commands.add("login", (usuario, senha) => {
  cy.get("#Usuário").type(usuario);
  cy.get("#Senha").type(senha);
  cy.get("#btn-login").click();
});

Cypress.Commands.add("loginInvalido", (usuario, senha) => {
  cy.get("#Usuário").type(usuario);
  cy.get("#Senha").type(senha);
  cy.get("#btn-login").click();
});
