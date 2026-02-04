# language: pt
# Encoding: UTF-8
#
# Integração Azure TestPlan:
# - @TCID:CT02 mapeia para Test Case ID no Azure
# - @RF001 mapeia para Requirement ID
#
@clientes @ui @RF001
Funcionalidade: Cadastro de Cliente via Interface
  Como um usuário autenticado do sistema
  Eu quero cadastrar um novo cliente pela interface
  Para que o cliente fique registrado no sistema

  Contexto: Usuário autenticado na tela de clientes
    Dado que o usuário esteja autenticado no sistema
    E esteja na tela de cadastro de clientes

  @TCID:CT02 @smoke
  Cenário: CT02 - Cadastrar cliente com dados válidos
    Quando o usuário clicar no botão "Novo Cliente"
    E preencher o campo "nome_completo" com "Maria Oliveira Silva"
    E preencher o campo "cpf_cnpj" com "52998224725"
    E preencher o campo "email" com "maria.oliveira@teste.com"
    E preencher o campo "observacao" com "Cliente cadastrado via teste automatizado"
    E clicar no botão "Salvar"
    Então o sistema deve exibir a mensagem "Cliente cadastrado com sucesso"
    E o cliente "Maria Oliveira Silva" deve ser exibido na listagem de clientes
