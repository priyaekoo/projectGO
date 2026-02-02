const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const TestHelpers = require('../../support/helpers');
const database = require('../../support/database');

// Contexto compartilhado entre os steps
let helpers;
let dadosCliente;
let resposta;
let clienteIdCriado;

/**
 * HOOKS - Executados antes/depois de cada cenário
 */
Before(async function () {
  helpers = new TestHelpers();
  dadosCliente = null;
  resposta = null;
  clienteIdCriado = null;
});

After(async function () {
  // Limpeza: remove cliente criado durante o teste
  if (dadosCliente && dadosCliente.cpf_cnpj) {
    try {
      await database.deletarClientePorCpfCnpj(dadosCliente.cpf_cnpj);
    } catch (error) {
      // Ignora erro se cliente não existe
    }
  }
});

/**
 * GIVEN - Configuração inicial (Arranjo)
 */
Given('que estou autenticado na API com usuário {string} e senha {string}', async function (usuario, senha) {
  // Faz login na API e armazena o token
  const response = await helpers.loginApi(usuario, senha);

  expect(response.status).to.equal(200);
  expect(helpers.token).to.not.be.null;
});

Given('que tenho os dados de um novo cliente:', async function (dataTable) {
  // Converte a DataTable do Gherkin para objeto JavaScript
  const dados = dataTable.hashes()[0];

  dadosCliente = {
    nome_completo: dados.nome_completo,
    email: dados.email,
    cpf_cnpj: dados.cpf_cnpj,
    observacao: dados.observacao || ''
  };

  // Limpeza prévia: garante que não existe cliente com este CPF
  await database.deletarClientePorCpfCnpj(dadosCliente.cpf_cnpj);
});

Given('que tenho os dados de um cliente com CPF inválido:', async function (dataTable) {
  const dados = dataTable.hashes()[0];

  dadosCliente = {
    nome_completo: dados.nome_completo,
    email: dados.email,
    cpf_cnpj: dados.cpf_cnpj,
    observacao: dados.observacao || ''
  };
});

/**
 * WHEN - Ação sendo testada
 */
When('envio uma requisição POST para {string} com os dados do cliente', async function (endpoint) {
  resposta = await helpers.apiRequest('POST', endpoint, dadosCliente);

  // Se criou com sucesso, guarda o ID para validação
  if (resposta.status === 201 && resposta.data && resposta.data.id) {
    clienteIdCriado = resposta.data.id;
  }
});

/**
 * THEN - Validações (Asserções)
 */
Then('a API deve retornar status {int}', function (statusEsperado) {
  expect(resposta.status).to.equal(statusEsperado);
});

Then('a resposta deve conter o ID do cliente criado', function () {
  expect(resposta.data).to.have.property('id');
  expect(resposta.data.id).to.be.a('number');
});

Then('o cliente deve existir no banco de dados com os dados informados', async function () {
  const clienteNoBanco = await database.buscarClientePorCpfCnpj(dadosCliente.cpf_cnpj);

  expect(clienteNoBanco).to.not.be.null;
  expect(clienteNoBanco.nome_completo).to.equal(dadosCliente.nome_completo);
  expect(clienteNoBanco.email).to.equal(dadosCliente.email);
  expect(clienteNoBanco.cpf_cnpj).to.equal(dadosCliente.cpf_cnpj);
});

Then('o campo {string} deve ser true', async function (campo) {
  const clienteNoBanco = await database.buscarClientePorCpfCnpj(dadosCliente.cpf_cnpj);

  expect(clienteNoBanco).to.not.be.null;
  expect(clienteNoBanco[campo]).to.equal(true);
});

Then('o campo {string} deve ser {int}', async function (campo, valor) {
  const clienteNoBanco = await database.buscarClientePorCpfCnpj(dadosCliente.cpf_cnpj);

  expect(clienteNoBanco).to.not.be.null;
  // Converte para número pois PostgreSQL pode retornar como string
  expect(Number(clienteNoBanco[campo])).to.equal(valor);
});

Then('a resposta deve conter a mensagem de erro {string}', function (mensagemEsperada) {
  expect(resposta.data).to.have.property('erro');
  expect(resposta.data.erro).to.equal(mensagemEsperada);
});

Then('o cliente não deve existir no banco de dados', async function () {
  const clienteNoBanco = await database.buscarClientePorCpfCnpj(dadosCliente.cpf_cnpj);

  expect(clienteNoBanco).to.be.null;
});
