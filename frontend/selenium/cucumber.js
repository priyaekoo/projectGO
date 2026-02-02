/**
 * Configuração do Cucumber.js
 *
 * Este arquivo define como o Cucumber deve executar os testes BDD.
 *
 * Integração com Azure TestPlan:
 * - Use tags @TCID:CT01 para mapear Test Cases
 * - Use tags @RF001 para mapear Requirements
 * - O relatório JSON pode ser importado no Azure DevOps
 */
module.exports = {
  default: {
    // Onde estão os arquivos .feature
    paths: ['features/**/*.feature'],

    // Onde estão os step definitions
    require: ['step-definitions/**/*.js', 'support/hooks.js'],

    // Formato de saída
    format: [
      'progress-bar',                          // Barra de progresso no terminal
      'json:reports/cucumber-report.json',     // JSON para Azure DevOps
      'html:reports/cucumber-report.html'      // HTML para visualização local
    ],

    // Configurações de execução

    // Tags para filtrar cenários (pode ser sobrescrito via CLI)
    // Exemplo: npm run test:bdd -- --tags "@smoke"
  },

  // Perfil para testes de API apenas
  api: {
    paths: ['features/**/*.feature'],
    require: ['step-definitions/**/*.js', 'support/hooks.js'],
    tags: '@api',
    format: ['progress-bar', 'json:reports/api-report.json']
  },

  // Perfil para testes smoke (rápidos)
  smoke: {
    paths: ['features/**/*.feature'],
    require: ['step-definitions/**/*.js', 'support/hooks.js'],
    tags: '@smoke',
    format: ['progress-bar']
  }
};
