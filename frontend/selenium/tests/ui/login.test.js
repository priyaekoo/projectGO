const { expect } = require('chai');
const TestHelpers = require('../../support/helpers');
const authFixtures = require('../../fixtures/auth.json');

describe('UI - Login Page', function() {
  let helpers;

  before(async function() {
    helpers = new TestHelpers();
    await helpers.initBrowser();
  });

  after(async function() {
    await helpers.closeBrowser();
  });

  beforeEach(async function() {
    await helpers.navigateTo('/');
  });

  describe('Login Form', function() {
    it('CT01 - Login com sucesso deve redirecionar para /usuarios', async function() {
      const { usuario, senha } = authFixtures.loginValido;

      await helpers.type('input[type="email"]', usuario);
      await helpers.type('input[type="password"]', senha);
      await helpers.click('button[type="submit"]');

      await helpers.waitForUrlContains('/usuarios');
      const currentUrl = await helpers.getCurrentUrl();

      expect(currentUrl).to.include('/usuarios');
    });

    it('CT02 - Login com credenciais invalidas deve exibir erro', async function() {
      const { usuario, senha } = authFixtures.loginSenhaInvalida;

      await helpers.type('input[type="email"]', usuario);
      await helpers.type('input[type="password"]', senha);
      await helpers.click('button[type="submit"]');

      const errorElement = await helpers.waitForElement('.error-message, .alert-error, [class*="error"]');
      const errorText = await errorElement.getText();

      expect(errorText.length).to.be.greaterThan(0);
    });
  });
});
