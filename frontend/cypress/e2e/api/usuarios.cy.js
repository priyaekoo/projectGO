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
    const nome = faker.person.fullName();

    cy.gerarCPFValido().then((cpf) => {
      const usuario = {
        nome_completo: nome,
        email: `usuario_${Date.now()}@email.com`,
        cpf: cpf,
        senha: "123456",
      };

      cy.apiRequest("POST", "/usuarios", usuario).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("id");

        const userId = response.body.id;
        usuariosCriados.push(userId);

        // 🔍 Validação no "banco" via API de consulta
        cy.apiRequest("GET", `/usuarios/${userId}`).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.nome_completo).to.eq(usuario.nome_completo);
          expect(getResponse.body.email).to.eq(usuario.email);
          expect(getResponse.body.cpf).to.eq(usuario.cpf);
        });
      });
    });
  });
});
