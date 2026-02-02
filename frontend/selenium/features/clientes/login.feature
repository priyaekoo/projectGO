# language: pt

@login @ui
Funcionalidade: Login no Sistema
  Como um usuário do sistema
  Eu quero fazer login com minhas credenciais
  Para acessar o sistema

  @TCID:CT03 @smoke
  Cenário: CT03 - Login com credenciais válidas
    Dado que estou na página de login
    Quando preencho o email "adm@email.com"
    E preencho a senha "123456"
    E clico no botão entrar
    Então devo ser redirecionado para "/dashboard"

  @TCID:CT04 @negative
  Cenário: CT04 - Login com senha incorreta
    Dado que estou na página de login
    Quando preencho o email "adm@email.com"
    E preencho a senha "senhaErrada"
    E clico no botão entrar
    Então devo ver a mensagem de erro "Usuário ou senha inválidos"
