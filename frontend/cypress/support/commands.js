/// <reference types="cypress" />

import { cpf } from "cpf-cnpj-validator";

/* ===============================
   COMMANDS DE UI
================================ */

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

/* ===============================
   COMMANDS DE API
================================ */

Cypress.Commands.add("loginApi", () => {
  cy.fixture("auth").then((auth) => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/login`,
      headers: {
        "Content-Type": "application/json",
      },
      body: auth.loginValido,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("token");

      Cypress.env("token", response.body.token);
    });
  });
});

Cypress.Commands.add(
  "apiRequest",
  (method, endpoint, body = null, options = {}) => {
    return cy.request({
      method,
      url: `${Cypress.env("apiUrl")}${endpoint}`,
      body,
      headers: {
        Authorization: `Bearer ${Cypress.env("token")}`,
        "Content-Type": "application/json",
      },
      ...options,
    });
  }
);

const cpfValido = cpf.generate();
Cypress.Commands.add("gerarCPFValido", () => {
  return cpfValido;
});
