const { expect } = require('chai');
const TestHelpers = require('../../support/helpers');
const authFixtures = require('../../fixtures/auth.json');

describe('API - Autenticacao', function() {
  let helpers;

  before(function() {
    helpers = new TestHelpers();
  });

  describe('POST /auth/login', function() {
    it('CT01 - Login com sucesso deve retornar token JWT', async function() {
      const { usuario, senha } = authFixtures.loginValido;

      const response = await helpers.apiRequest('POST', '/auth/login', {
        usuario,
        senha
      });

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      expect(response.data.token).to.be.a('string');
    });

    it('CT02 - Login com senha invalida deve retornar 401', async function() {
      const { usuario, senha } = authFixtures.loginSenhaInvalida;

      const response = await helpers.apiRequest('POST', '/auth/login', {
        usuario,
        senha
      });

      expect(response.status).to.equal(401);
    });

    it('CT03 - Login com usuario inexistente deve retornar 401', async function() {
      const { usuario, senha } = authFixtures.loginUsuarioInexistente;

      const response = await helpers.apiRequest('POST', '/auth/login', {
        usuario,
        senha
      });

      expect(response.status).to.equal(401);
    });
  });
});
