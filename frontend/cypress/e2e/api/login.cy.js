/// <reference types="cypress" />

describe("API - Login", () => {
  const baseUrl = "http://localhost:3000";

  // eslint-disable-next-line no-undef
  it("CT01 - Login com sucesso retorna token JWT", () => {
    cy.fixture("auth").then((auth) => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/login`,
        body: auth.loginValido,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("token");
        expect(response.body.token.split(".")).to.have.length(3);
      });
    });
  });

  it("CT02 - Login com senha inválida retorna 401", () => {
    cy.fixture("auth").then((auth) => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/login`,
        body: auth.loginSenhaInvalida,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  it("CT03 - Login com usuário inexistente retorna 401", () => {
    cy.fixture("auth").then((auth) => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/login`,
        body: auth.loginUsuarioInexistente,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });
});
