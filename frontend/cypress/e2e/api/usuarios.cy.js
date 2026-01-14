/// <reference types="cypress" />

import { faker } from "@faker-js/faker";

describe("API - Usuários (rota protegida)", () => {
  let usuariosCriados = [];

  before(() => {
    cy.loginApi();
  });

  afterEach(() => {
    usuariosCriados.forEach((id) => {
      cy.apiRequest("DELETE", `/usuarios/${id}`);
    });
    usuariosCriados = [];
  });

  it("CT01 - Acessar usuários com token válido", () => {
    cy.apiRequest("GET", "/usuarios").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an("array");
    });
  });

  it("CT02 - Login com senha inválida deve bloquear acesso", () => {
    cy.fixture("auth").then((auth) => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: auth.loginSenhaInvalida,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property("erro");
        expect(response.body.erro).to.contain("Senha inválida");
      });
    });
  });

  it("CT03 - Criar usuário com sucesso (token válido)", () => {
    const criarUsuarios = faker.person.fullName();
    cy.gerarCPFValido().then((cpf) => {
      const usuario = {
        nome_completo: criarUsuarios,
        email: `usuario_${Date.now()}@email.com`,
        cpf: cpf,
        senha: "123456",
      };

      cy.apiRequest("POST", "/usuarios", usuario).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("id");
        usuariosCriados.push(response.body.id);
      });
    });
  });
});
