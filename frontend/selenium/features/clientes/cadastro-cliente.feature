# language: pt
# Encoding: UTF-8
#
# Integração Azure TestPlan:
# - @TCID:CT01 mapeia para Test Case ID no Azure
# - @RF001 mapeia para Requirement ID
#
@clientes @api @RF001
Funcionalidade: Cadastro de Cliente via API
  Como um usuário autenticado do sistema
  Eu quero cadastrar um novo cliente via API
  Para que o cliente fique registrado no banco de dados

  Contexto: Usuário autenticado
    Dado que estou autenticado na API com usuário "adm@email.com" e senha "123456"

  @TCID:CT01 @smoke
  Cenário: CT01 - Cadastrar cliente com dados válidos
    Dado que tenho os dados de um novo cliente:
      | nome_completo | email                | cpf_cnpj       | observacao        |
      | João da Silva | joao.silva@email.com | 529.982.247-25 | Cliente de teste  |
    Quando envio uma requisição POST para "/clientes" com os dados do cliente
    Então a API deve retornar status 201
    E a resposta deve conter o ID do cliente criado
    E o cliente deve existir no banco de dados com os dados informados
    E o campo "ativo" deve ser true
    E o campo "saldo_inicial" deve ser 0

  @TCID:CT02 @negative
  Cenário: CT02 - Rejeitar cadastro com CPF inválido
    Dado que tenho os dados de um cliente com CPF inválido:
      | nome_completo | email               | cpf_cnpj    | observacao |
      | Maria Santos  | maria@email.com     | 111.111.111-11 | Teste CPF  |
    Quando envio uma requisição POST para "/clientes" com os dados do cliente
    Então a API deve retornar status 400
    E a resposta deve conter a mensagem de erro "CPF ou CNPJ inválido"
    E o cliente não deve existir no banco de dados
