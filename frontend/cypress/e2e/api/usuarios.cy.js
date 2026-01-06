import auth from "../../fixtures/auth.json";

describe("API - Usuários (rota protegida)", () => {
  it("CT04 - Acessar usuários com token válido", () => {
    cy.request("POST", "/auth/login", auth.loginValido).then(
      (loginResponse) => {
        const token = loginResponse.body.token;

        cy.request({
          method: "GET",
          url: "/usuarios",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an("array");
        });
      }
    );
  });

  it("CT05 - Acessar usuários sem token retorna 401", () => {
    cy.request({
      method: "GET",
      url: "/usuarios",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });
});
