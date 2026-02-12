# Documento de Requisitos - ProjectGO

**Sistema:** ProjectGO - Plataforma de Gestao Financeira
**Versao:** 2.0 (com modulos BTG Pactual)
**Data:** Fevereiro/2026
**Ambiente:** Backend (Node.js:3000) | Frontend (React:5173) | PostgreSQL

---

## 1. AUTENTICACAO

### 1.1 Login (POST /auth/login)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| usuario | string | Sim | Email OU CPF do usuario |
| senha | string | Sim | Senha do usuario |

**Regras de Negocio:**
- O campo `usuario` aceita tanto email quanto CPF como identificador
- A senha e comparada usando bcrypt
- Apos autenticacao, o sistema gera um token JWT com validade de **8 horas**
- O payload do JWT contem: `id`, `nome` (nome_completo) e `perfil`
- O response retorna: `token` + objeto `usuario` (id, nome, email, perfil)
- O token e armazenado no localStorage do navegador
- Todas as requisicoes subsequentes enviam o token via header `Authorization: Bearer {token}`

**Respostas de Erro:**
| HTTP | Mensagem | Condicao |
|------|----------|----------|
| 401 | "Usuario nao encontrado" | Nenhum registro com email/CPF informado |
| 401 | "Senha invalida" | Senha nao confere com o hash |
| 500 | Erro generico | Falha no servidor |

---

## 2. CADASTROS

### 2.1 Usuarios (CRUD completo)

**Campos do formulario:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| nome_completo | string | Sim | Nao pode ser vazio |
| email | string | Sim | Formato email valido (x@x.x) |
| cpf | string | Sim | CPF valido (11 digitos + algoritmo) |
| senha | string | Sim (criar) | Min 8 chars, letras, numeros e caractere especial |
| perfil | select | Sim | Valores: `admin`, `analista`, `operador` (default: operador) |

**Regras de Negocio:**
- CPF e email devem ser unicos no banco (constraint unique)
- A senha e armazenada com hash bcrypt (salt 10)
- Inativacao e feita via soft delete (campo `ativo = false`)
- Usuarios inativos **nao podem ser editados**
- Usuarios inativos podem ser reativados
- Perfil aparece na tabela de listagem e nos modais de criar/editar
- A listagem exibe todos os usuarios (ativos e inativos), ordenados por nome

**Paginacao:**
- 10 itens por pagina no frontend

**Respostas de Erro:**
| HTTP | Mensagem | Condicao |
|------|----------|----------|
| 400 | "CPF invalido" | CPF nao passa na validacao |
| 400 | "CPF ou e-mail ja cadastrado" | Violacao de constraint unique (code 23505) |
| 400 | "Usuario inativo nao pode ser editado" | Tentativa de editar usuario com ativo=false |
| 404 | "Usuario nao encontrado" | ID inexistente |

---

### 2.2 Clientes

**Campos:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| nome_completo | string | Sim | - |
| email | string | Sim | - |
| cpf_cnpj | string | Sim | CPF ou CNPJ valido (lib cpf-cnpj-validator) |
| observacao | string | Nao | - |
| pep | boolean | - | Default: false (gerenciado pelo modulo AML) |
| nivel_risco | string | - | Default: 'BAIXO' (gerenciado pelo modulo AML) |

**Regras de Negocio:**
- Aceita CPF (11 digitos) ou CNPJ (14 digitos)
- CPF/CNPJ **nao pode ser alterado** apos criacao
- Inativacao via soft delete
- Cada cliente possui um `saldo_inicial` definido na criacao
- O campo `pep` e `nivel_risco` sao gerenciados pelo modulo AML/Compliance

---

### 2.3 Fornecedores

- Mesma estrutura base dos clientes
- Participam do fluxo de Contas a Pagar (recebem pagamentos)
- Possuem saldo calculado via movimentacoes

---

## 3. MODELO DE SALDO

### 3.1 Formula Universal de Calculo de Saldo

O saldo de um cliente/fornecedor e **calculado em tempo real** a cada consulta, nao e armazenado como campo fixo.

```
saldo_atual = saldo_inicial + SUM(ENTRADAS) - SUM(SAIDAS)
```

**Detalhamento:**
```sql
saldo_atual = saldo_inicial + COALESCE(
  SUM(CASE
    WHEN tipo = 'ENTRADA' THEN valor
    WHEN tipo = 'SAIDA' THEN -valor
  END),
  0
)
-- Somente movimentacoes onde estornado = false
```

**Importante:**
- Movimentacoes estornadas (`estornado = true`) sao **excluidas** do calculo
- Clientes sem movimentacoes retornam o `saldo_inicial`
- Esta formula e usada em: Transferencias, Contas a Pagar, Aplicacoes, Ordens de Compra, Transacoes de Alto Valor e Lote

### 3.2 Tabela movimentacoes

Toda operacao financeira gera registro(s) na tabela `movimentacoes`:

| Campo | Descricao |
|-------|-----------|
| id_cliente | Cliente vinculado |
| tipo | `ENTRADA` ou `SAIDA` |
| valor | Valor da operacao |
| origem | Identifica a fonte (ver tabela abaixo) |
| descricao | Texto descritivo |
| estornado | Boolean - se foi revertido |
| data_movimentacao | Timestamp automatico |

**Origens possiveis:**
| Origem | Modulo |
|--------|--------|
| DEPOSITO | Depositos |
| TRANSFERENCIA | Transferencias simples |
| TRANSFERENCIA_ALTO_VALOR | Transacoes Avancadas |
| TRANSFERENCIA_LOTE | Transacoes Avancadas |
| PAGAMENTO | Contas a Pagar (saida do cliente) |
| RECEBIMENTO | Contas a Pagar (entrada no fornecedor) |
| CONTA_RECEBER | Contas a Receber |
| APLICACAO | Investimentos (saida do cliente) |
| RESGATE | Investimentos (entrada no cliente) |
| ORDEM_COMPRA | Ordens (saida do cliente) |
| ORDEM_VENDA | Ordens (entrada no cliente) |
| ESTORNO | Estornos |

---

## 4. MOVIMENTACOES BASICAS

### 4.1 Depositos (POST /depositos)

| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| id_cliente | Sim | Cliente que recebe o deposito |
| valor | Sim | Valor a depositar |
| descricao | Nao | Default: "Deposito manual" |

**Regras de Negocio:**
- Cria movimentacao tipo `ENTRADA` com origem `DEPOSITO`
- **Nao valida saldo** - depositos sao sempre permitidos
- Nao possui limite maximo de valor

---

### 4.2 Transferencias Simples (POST /transferencias)

| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| id_cliente_origem | Sim | Quem envia |
| id_cliente_destino | Sim | Quem recebe |
| valor | Sim | Valor da transferencia |
| descricao | Nao | Texto livre |

**Regras de Negocio:**
- Cliente origem e destino **devem ser diferentes**
- Valor deve ser **maior que zero**
- Sistema verifica saldo do cliente origem **antes** da transferencia
- Gera **duas movimentacoes**: SAIDA (origem) + ENTRADA (destino)
- Operacao transacional (BEGIN/COMMIT/ROLLBACK) - tudo ou nada
- Descricao automatica: "Transferencia para/de {nome}"

**Respostas de Erro:**
| HTTP | Mensagem |
|------|----------|
| 400 | "Cliente origem e destino devem ser diferentes" |
| 400 | "Valor deve ser maior que zero" |
| 400 | "Saldo insuficiente" (retorna saldo_atual e valor_transferencia) |
| 404 | "Cliente origem/destino nao encontrado" |

---

### 4.3 Contas a Pagar

**Criar Conta (POST /contas-pagar):**
| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| id_fornecedor | Sim | Fornecedor beneficiario |
| valor | Sim | Valor da conta |
| data_vencimento | Sim | Data de vencimento |
| id_cliente | Nao | Cliente que pagara (pode ser definido depois) |
| descricao | Nao | Texto livre |

**Pagar Conta (PUT /contas-pagar/:id/pagar):**
- Somente contas com status `PENDENTE` podem ser pagas
- Se id_cliente nao foi definido na criacao, **deve ser informado** no momento do pagamento
- Verifica saldo do cliente antes de pagar
- Gera SAIDA no cliente + ENTRADA no fornecedor
- Atualiza status para `PAGA` com `data_pagamento = NOW()`
- Operacao transacional

**Fluxo de Status:**
```
PENDENTE --> PAGA (via pagamento)
PENDENTE --> CANCELADA (via cancelamento)
```

---

### 4.4 Contas a Receber

**Criar Conta (POST /contas-receber):**
| Campo | Obrigatorio |
|-------|-------------|
| id_cliente | Sim |
| valor | Sim |
| data_vencimento | Sim |
| descricao | Nao |

**Pagar Conta (PUT /contas-receber/:id/pagar):**
- Somente contas `PENDENTE` podem ser pagas
- Gera ENTRADA no cliente com origem `CONTA_RECEBER`
- Atualiza status para `PAGA`

---

### 4.5 Estornos (POST /estornos/:id)

**Regras de Negocio:**
- Recebe o `id` da movimentacao original
- Movimentacao ja estornada **nao pode ser estornada novamente**
- Marca a movimentacao original como `estornado = true`
- Cria movimentacao reversa com tipo oposto (ENTRADA <-> SAIDA)
- Mesmo valor, origem = `ESTORNO`
- Operacao transacional

---

## 5. TRANSACOES AVANCADAS (Cenario BTG)

### 5.1 Transferencia de Alto Valor (POST /transacoes-avancadas/alto-valor)

| Campo | Obrigatorio |
|-------|-------------|
| id_cliente_origem | Sim |
| id_cliente_destino | Sim |
| valor | Sim (> 0) |
| descricao | Nao |

**Tabela de Taxas Progressivas:**
| Faixa de Valor | Taxa |
|----------------|------|
| Ate R$ 10.000,00 | 0% (isento) |
| R$ 10.000,01 a R$ 50.000,00 | 0,5% |
| R$ 50.000,01 a R$ 100.000,00 | 0,3% |
| Acima de R$ 100.000,00 | 0,1% |

**Regras de Negocio:**
- A taxa e calculada sobre o valor total da transferencia
- `valor_taxa = valor * (taxa_percentual / 100)`
- O valor debitado do cliente origem = **valor + taxa**
- O valor creditado no cliente destino = **somente o valor** (sem taxa)
- A taxa fica retida no sistema (nao e creditada em nenhuma conta)
- Verifica saldo considerando valor + taxa
- Gera registro no `audit_log`
- Origem da movimentacao: `TRANSFERENCIA_ALTO_VALOR`

**Consulta de Taxa (GET /transacoes-avancadas/taxa?valor=X):**
- Retorna: valor, taxa_percentual, valor_taxa, valor_total
- O frontend consulta esta rota em tempo real ao digitar o valor

---

### 5.2 Transferencias em Lote (POST /transacoes-avancadas/lote)

| Campo | Obrigatorio |
|-------|-------------|
| transferencias | Sim (array) |

**Cada item do array:**
| Campo | Obrigatorio |
|-------|-------------|
| id_cliente_origem | Sim |
| id_cliente_destino | Sim |
| valor | Sim (> 0) |
| descricao | Nao |

**Regras de Negocio:**
- Maximo de **50 transferencias** por lote
- Todas as transferencias rodam dentro de uma unica transacao de banco
- Transferencias invalidas sao **ignoradas** (nao abortam o lote)
- O resultado retorna status individual por transferencia (indice, OK/ERRO, motivo)
- **Nao aplica taxa** nas transferencias em lote
- Origem: `TRANSFERENCIA_LOTE`

**Resposta:**
```json
{
  "total": 5,
  "sucesso": 3,
  "erros": 2,
  "resultados": [
    { "indice": 0, "status": "OK", "valor": 100.00 },
    { "indice": 1, "status": "ERRO", "erro": "Saldo insuficiente" }
  ]
}
```

---

## 6. AML / COMPLIANCE (Cenario BTG)

### 6.1 Conceitos

- **PEP (Pessoa Exposta Politicamente):** Cliente que ocupa ou ocupou cargo publico relevante, exigindo monitoramento reforçado
- **AML (Anti-Money Laundering):** Procedimentos de prevencao a lavagem de dinheiro
- **Nivel de Risco:** Classificacao do cliente: `BAIXO`, `MEDIO`, `ALTO`, `CRITICO`
- **Audit Log:** Registro imutavel de todas as acoes realizadas no modulo

### 6.2 Gerenciamento PEP

**Marcar/Desmarcar PEP (PATCH /aml/clientes/:id/pep):**
| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| pep | Sim | true/false |
| nivel_risco | Nao | Default: BAIXO |
| id_usuario | Sim | Quem realizou a acao |

**Regras de Negocio:**
- Qualquer cliente pode ser marcado/desmarcado como PEP
- A alteracao registra no `audit_log` os dados anteriores e novos (JSON)
- Ao marcar como PEP, o nivel_risco e automaticamente definido como `ALTO`
- Ao desmarcar, o nivel_risco volta para `BAIXO`

### 6.3 Investigacoes AML

**Criar Investigacao (POST /aml/investigacoes):**
| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| id_cliente | Sim | Cliente investigado |
| motivo | Sim | Descricao do motivo |
| id_analista | Nao | Usuario responsavel |
| nivel_risco | Nao | Default: MEDIO |

**Regras de Negocio:**
- Verifica se o cliente existe antes de criar
- Se nivel_risco = `CRITICO`, o cliente e **automaticamente marcado como PEP** e seu nivel_risco na tabela clientes e atualizado para CRITICO
- Registra no `audit_log`
- Status inicial: `ABERTA`

**Fluxo de Status:**
```
ABERTA --> EM_ANALISE --> FECHADA
```

**Atualizar Investigacao (PATCH /aml/investigacoes/:id):**
| Campo | Descricao |
|-------|-----------|
| status | ABERTA, EM_ANALISE ou FECHADA |
| conclusao | Texto da conclusao |
| nivel_risco | Reclassificacao de risco |

- Ao definir status = `FECHADA`, o sistema preenche `data_fechamento = NOW()` automaticamente
- Registra no `audit_log` com dados antes/depois

### 6.4 Audit Log (GET /aml/audit-log)

**Filtros disponiveis:**
| Parametro | Descricao |
|-----------|-----------|
| tabela | Filtrar por tabela (ex: clientes, investigacoes_aml) |
| acao | Filtrar por acao (ex: ALTERACAO_PEP, CRIAR_INVESTIGACAO) |
| limit | Quantidade maxima (default: 100) |

**Acoes registradas:**
| Acao | Quando |
|------|--------|
| ALTERACAO_PEP | Marcar/desmarcar PEP |
| CRIAR_INVESTIGACAO | Nova investigacao |
| ATUALIZAR_INVESTIGACAO | Alterar status/conclusao |
| TRANSFERENCIA_ALTO_VALOR | Transferencia com taxa |

---

## 7. INVESTIMENTOS (Cenario BTG)

### 7.1 Fundos de Investimento

**Fundos pre-cadastrados (seed data):**
| Fundo | Tipo | Benchmark | Rent. Anual | Taxa Admin | Taxa Perf |
|-------|------|-----------|-------------|------------|-----------|
| BTG RF DI | RENDA_FIXA | CDI | 12,80% | 0,50% | 0% |
| BTG Multimercado Macro | MULTIMERCADO | CDI | 15,20% | 1,80% | 20% |
| BTG Acoes Value | ACOES | IBOVESPA | 22,50% | 2,00% | 20% |
| BTG Credito Privado | RENDA_FIXA | CDI | 14,30% | 1,20% | 10% |
| BTG Small Caps | ACOES | SMLL | **-8,40%** | 2,50% | 20% |

### 7.2 Aplicacao (POST /investimentos/aplicar)

| Campo | Obrigatorio | Validacao |
|-------|-------------|-----------|
| id_cliente | Sim | Cliente deve existir |
| id_fundo | Sim | Fundo deve existir e estar ativo |
| valor | Sim | **Minimo R$ 100,00** |

**Regras de Negocio:**
- Verifica saldo do cliente
- Cria registro na tabela `aplicacoes` com status `ATIVA`
- Debita valor do saldo do cliente (SAIDA com origem `APLICACAO`)
- Operacao transacional

### 7.3 Resgate (POST /investimentos/resgatar/:id)

**Regras de Negocio:**
- Somente aplicacoes com status `ATIVA` podem ser resgatadas
- O sistema calcula a rentabilidade com base nos dias investidos

**Formula de Calculo:**
```
dias_investido = (data_atual - data_aplicacao) em dias

rentabilidade_diaria = (rentabilidade_anual / 100) / 252
    (252 = dias uteis no ano)

rendimento_bruto = valor_aplicado * rentabilidade_diaria * dias_investido

desconto_taxa_admin = rendimento_bruto * (taxa_administracao / 100)
desconto_taxa_perf  = rendimento_bruto * (taxa_performance / 100)
    (taxa performance so incide se rendimento > 0)

valor_resgate = valor_aplicado + rendimento_bruto - desconto_taxa_admin - desconto_taxa_perf
```

**Apos calculo:**
- Atualiza aplicacao: status = `RESGATADA`, data_resgate = NOW(), valor_resgate
- Credita valor_resgate no saldo do cliente (ENTRADA com origem `RESGATE`)

**Fluxo de Status:**
```
ATIVA --> RESGATADA
```

### 7.4 Carteira do Cliente (GET /investimentos/carteira/:id_cliente)

- Calcula rentabilidade de **todas** as aplicacoes ativas do cliente
- Retorna: total_aplicado, total_atual, rendimento_total, rentabilidade_total (%), detalhes por fundo

### 7.5 Rentabilidade Individual (GET /investimentos/rentabilidade/:id)

- Calcula rentabilidade detalhada de uma aplicacao especifica
- Se aplicacao foi resgatada, usa data_resgate como referencia; senao, usa data atual
- Retorna: rendimento bruto, taxas, rendimento liquido, valor atual, rentabilidade %

---

## 8. ORDENS DE COMPRA E VENDA (Cenario BTG)

### 8.1 Horario de Mercado

O sistema valida o horario de funcionamento da B3 antes de permitir ordens.

**Configuracao (tabela config_mercado):**
| Chave | Valor |
|-------|-------|
| MERCADO_ABERTURA | 10:00 |
| MERCADO_FECHAMENTO | 17:00 |
| MERCADO_PRE_ABERTURA | 09:45 |
| MERCADO_AFTER_MARKET | 17:30 |
| MERCADO_AFTER_MARKET_FIM | 18:00 |
| MERCADO_DIAS_UTEIS | SEG,TER,QUA,QUI,SEX |

**Regras:**
- Mercado aberto: dia util E horario entre abertura e fechamento
- Sabados, domingos e feriados: mercado fechado
- O indicador no frontend atualiza a cada 60 segundos

### 8.2 Ativos Disponiveis

**Ativos pre-cadastrados (seed data):**
| Codigo | Nome | Tipo | Preco Atual |
|--------|------|------|-------------|
| PETR4 | Petrobras PN | ACAO | R$ 38,50 |
| VALE3 | Vale ON | ACAO | R$ 68,20 |
| ITUB4 | Itau Unibanco PN | ACAO | R$ 32,80 |
| BBDC4 | Bradesco PN | ACAO | R$ 15,40 |
| ABEV3 | Ambev ON | ACAO | R$ 12,90 |
| WEGE3 | WEG ON | ACAO | R$ 42,10 |
| RENT3 | Localiza ON | ACAO | R$ 58,30 |
| BBAS3 | Banco do Brasil ON | ACAO | R$ 28,70 |
| MGLU3 | Magazine Luiza ON | ACAO | R$ 2,15 |
| BOVA11 | iShares Ibovespa | ETF | R$ 118,50 |

### 8.3 Criar Ordem (POST /ordens)

| Campo | Obrigatorio | Validacao |
|-------|-------------|-----------|
| id_cliente | Sim | Cliente deve existir |
| id_ativo | Sim | Ativo deve existir |
| tipo | Sim | `COMPRA` ou `VENDA` |
| quantidade | Sim | > 0 |
| preco_unitario | Sim | > 0 |

**Regras de Negocio:**
- **Lote padrao B3:** Para ativos do tipo `ACAO`, a quantidade deve ser **multiplo de 100**
- ETFs nao tem restricao de lote
- **Mercado deve estar aberto** para criar ordens
- Para ordens de COMPRA: verifica saldo do cliente (valor_total = quantidade * preco_unitario)
- Para ordens de VENDA: **nao verifica saldo** (assume que o cliente possui os ativos)
- Status inicial: `PENDENTE`
- O frontend pre-preenche o preco_unitario com o preco atual do ativo

### 8.4 Executar Ordem (POST /ordens/:id/executar)

**Regras de Negocio:**
- Somente ordens `PENDENTE` podem ser executadas
- Antes de executar, compara o preco da ordem com o preco atual do ativo

**Validacao de Variacao de Preco:**
```
variacao = ABS((preco_atual_ativo - preco_unitario_ordem) / preco_unitario_ordem) * 100

Se variacao > 5%:
  Status = REJEITADA
  motivo_rejeicao = "Variacao de preco acima de 5% (X.XX%)"
```

**Se aprovada:**
- COMPRA: cria SAIDA no cliente com valor_total (origem `ORDEM_COMPRA`)
- VENDA: cria ENTRADA no cliente com valor_total (origem `ORDEM_VENDA`)
- Status = `EXECUTADA`, data_execucao = NOW()

### 8.5 Cancelar Ordem (PATCH /ordens/:id/cancelar)

- Somente ordens `PENDENTE` podem ser canceladas
- Status = `CANCELADA`

**Fluxo de Status:**
```
PENDENTE --> EXECUTADA (execucao bem-sucedida)
PENDENTE --> REJEITADA (variacao de preco > 5%)
PENDENTE --> CANCELADA (cancelamento manual)
```

---

## 9. CONCILIACAO BANCARIA (Cenario BTG)

### 9.1 Conceitos

- **Transacao Externa:** Registro de operacao vinda de sistema externo (ex: SPB - Sistema de Pagamentos Brasileiro)
- **Movimentacao Interna:** Registro no sistema ProjectGO (tabela movimentacoes)
- **Conciliacao:** Processo de comparar transacoes externas com internas para identificar divergencias

### 9.2 Importar Transacoes Externas (POST /conciliacao/importar)

**Formato do JSON:**
```json
{
  "transacoes": [
    {
      "codigo_externo": "SPB-001",
      "id_cliente": 1,
      "tipo": "CREDITO",
      "valor": 1000.00,
      "descricao": "Deposito via SPB",
      "data_transacao": "2025-01-15T10:00:00Z",
      "origem": "SPB"
    }
  ]
}
```

| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| codigo_externo | Sim | Identificador unico da transacao externa |
| tipo | Sim | `CREDITO` ou `DEBITO` |
| valor | Sim | Valor da transacao |
| data_transacao | Sim | Data/hora da transacao |
| id_cliente | Nao | Cliente vinculado |
| descricao | Nao | Descricao |
| origem | Nao | Default: "SPB" |

**Regras de Negocio:**
- `codigo_externo` deve ser **unico** (constraint unique)
- Transacoes duplicadas sao rejeitadas individualmente (nao abortam o lote)
- Status inicial: `PENDENTE`

### 9.3 Executar Conciliacao (POST /conciliacao/executar)

**Algoritmo de Matching:**
O sistema procura uma movimentacao interna correspondente para cada transacao externa pendente, usando 4 criterios simultaneos:

| Criterio | Regra |
|----------|-------|
| Cliente | Mesmo id_cliente (se informado na transacao externa) |
| Valor | Diferenca absoluta **< R$ 0,02** (tolerancia de centavos) |
| Tipo | CREDITO corresponde a ENTRADA; DEBITO corresponde a SAIDA |
| Data | **Mesmo dia** (ignora hora/minuto/segundo) |

**Classificacao do Resultado:**
| Status | Condicao |
|--------|----------|
| `CONCILIADA` | Match encontrado E diferenca <= R$ 0,001 |
| `DIVERGENTE` | Match encontrado MAS diferenca > R$ 0,001 (tipo_divergencia = 'VALOR') |
| `AUSENTE` | Nenhum match encontrado (tipo_divergencia = 'SEM_CORRESPONDENCIA') |

**Regras de Negocio:**
- Processa somente transacoes externas com status `PENDENTE`
- Para cada transacao, pega no maximo 1 match (`LIMIT 1`)
- Cria registro na tabela `conciliacoes` com valores internos, externos e diferenca
- Atualiza status da transacao externa

### 9.4 Simulacao (POST /conciliacao/simular)

**Regras de Negocio:**
- Busca as ultimas 20 movimentacoes internas do sistema
- Gera transacoes externas correspondentes com divergencias aleatorias:
  - **15% de chance:** altera o valor em +/- R$ 0,25 (divergencia de centavos)
  - **10% de chance:** pula a transacao (simula ausencia)
  - Adiciona 1 transacao "fantasma" que nao existe internamente
- Mapeia tipos: ENTRADA -> CREDITO, SAIDA -> DEBITO
- Retorna o JSON para o usuario importar manualmente

### 9.5 Resumo (GET /conciliacao/resumo)

Retorna contadores agregados:
- Total de conciliacoes
- Quantidade conciliadas
- Quantidade divergentes
- Quantidade ausentes
- Soma total das divergencias em R$

**Fluxo de Status das Transacoes Externas:**
```
PENDENTE --> CONCILIADA (match exato)
PENDENTE --> DIVERGENTE (match com diferenca de valor)
PENDENTE --> AUSENTE (sem correspondencia)
```

---

## 10. FLUXOS TRANSACIONAIS

### 10.1 Operacoes com BEGIN/COMMIT/ROLLBACK

As seguintes operacoes usam transacao de banco de dados (tudo ou nada):

| Operacao | Motivo |
|----------|--------|
| Transferencia simples | 2 movimentacoes (saida + entrada) |
| Pagamento de conta | Update conta + 2 movimentacoes |
| Recebimento de conta | Update conta + 1 movimentacao |
| Estorno | Update original + 1 movimentacao reversa |
| Transferencia alto valor | 2 movimentacoes + audit log |
| Transferencia lote | N * 2 movimentacoes |
| Aplicacao investimento | Insert aplicacao + 1 movimentacao |
| Resgate investimento | Update aplicacao + 1 movimentacao |
| Execucao de ordem | Update ordem + 1 movimentacao |

### 10.2 Operacoes SEM transacao

| Operacao | Motivo |
|----------|--------|
| Deposito | Operacao simples (1 insert) |
| CRUD de cadastros | Operacoes unitarias |
| Login | Somente leitura |
| Consultas/Listagens | Somente leitura |

---

## 11. REGRAS GERAIS DO SISTEMA

### 11.1 Soft Delete
- Usuarios e Clientes usam campo `ativo` (true/false)
- Registros inativos nao sao deletados fisicamente
- Registros inativos podem ser reativados

### 11.2 Validacoes Compartilhadas
- **CPF:** 11 digitos + algoritmo de verificacao
- **CNPJ:** 14 digitos + algoritmo de verificacao
- **Email:** Formato x@x.x
- **Senha:** Minimo 8 caracteres, pelo menos 1 letra, 1 numero e 1 caractere especial

### 11.3 Codigos de Erro HTTP
| Codigo | Uso |
|--------|-----|
| 200 | Sucesso (GET, PATCH, PUT) |
| 201 | Criacao com sucesso (POST) |
| 400 | Validacao falhou / Regra de negocio violada |
| 401 | Autenticacao falhou |
| 404 | Recurso nao encontrado |
| 500 | Erro interno do servidor |

### 11.4 Constraint de Banco (code 23505)
Violacao de campo unique retorna erro especifico:
- CPF/Email duplicado em usuarios
- CPF/CNPJ duplicado em clientes
- codigo_externo duplicado em transacoes_externas
- chave duplicada em config_mercado

---

## 12. ENDPOINTS - REFERENCIA RAPIDA

### Cadastros
```
POST   /auth/login
GET    /usuarios
POST   /usuarios
PATCH  /usuarios/:id
DELETE /usuarios/:id
PATCH  /usuarios/:id/reativar
GET    /clientes
POST   /clientes
PUT    /clientes/:id
DELETE /clientes/:id
PUT    /clientes/:id/reativar
GET    /clientes/:id/saldo
GET    /clientes/:id/extrato
```

### Movimentacoes
```
GET    /depositos
POST   /depositos
GET    /transferencias
POST   /transferencias
GET    /contas-pagar
POST   /contas-pagar
PUT    /contas-pagar/:id/pagar
PUT    /contas-pagar/:id/cancelar
GET    /contas-receber
POST   /contas-receber
PUT    /contas-receber/:id/pagar
POST   /estornos/:id
```

### Transacoes Avancadas
```
GET    /transacoes-avancadas/taxa?valor=X
POST   /transacoes-avancadas/alto-valor
POST   /transacoes-avancadas/lote
GET    /transacoes-avancadas
```

### AML / Compliance
```
GET    /aml/clientes-pep
PATCH  /aml/clientes/:id/pep
POST   /aml/investigacoes
GET    /aml/investigacoes
GET    /aml/investigacoes/:id
PATCH  /aml/investigacoes/:id
GET    /aml/audit-log
```

### Investimentos
```
GET    /investimentos/fundos
POST   /investimentos/aplicar
POST   /investimentos/resgatar/:id
GET    /investimentos/aplicacoes
GET    /investimentos/rentabilidade/:id
GET    /investimentos/carteira/:id_cliente
```

### Ordens
```
GET    /ordens/mercado
GET    /ordens/ativos
POST   /ordens
GET    /ordens
PATCH  /ordens/:id/cancelar
POST   /ordens/:id/executar
```

### Conciliacao
```
POST   /conciliacao/importar
GET    /conciliacao/externas
POST   /conciliacao/executar
GET    /conciliacao
GET    /conciliacao/resumo
POST   /conciliacao/simular
```

### Relatorios
```
GET    /relatorios/resumo
GET    /relatorios/movimentacoes-recentes
```
