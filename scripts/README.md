# Scripts de Gerenciamento - ProjectGO

Scripts para facilitar o gerenciamento das branches de desenvolvimento e testes.

---

## Como Usar

### Windows (Prompt de Comando ou PowerShell)
```cmd
cd D:\projectGO\scripts
git-helper.bat
```

### Git Bash / Linux / Mac
```bash
cd /d/projectGO/scripts
bash git-helper.sh
```

---

## Estrutura das Branches

| Branch | Proposito | Conteudo |
|--------|-----------|----------|
| `main` | Desenvolvimento da aplicacao | Backend + Frontend (sem testes) |
| `cypress-tests` | Testes com Cypress | Aplicacao + testes Cypress |
| `playwright-tests` | Testes com Playwright | Aplicacao + testes Playwright |
| `selenium-tests` | Testes com Selenium | Aplicacao + testes Selenium |

---

## Fluxo de Trabalho

### 1. Desenvolvendo a Aplicacao (branch main)

```bash
# Garante que esta na main
git checkout main
git pull origin main

# Faz as alteracoes no codigo
# ... edita arquivos em backend/ ou frontend/src/ ...

# Commita e envia
git add .
git commit -m "feat: descricao da alteracao"
git push origin main
```

### 2. Atualizando Branches de Teste

**IMPORTANTE:** Sempre que finalizar algo na `main`, atualize as branches de teste!

**ATENCAO: NAO use `git merge main` diretamente! Isso apagaria os testes.**

**Use o script (OBRIGATORIO):**
```cmd
scripts\git-helper.bat
# Escolha opcao 6 - Atualizar TODAS as branches
# Ou opcao 7 - Atualizar UMA branch especifica
```

O script usa **cherry-pick** para aplicar apenas os commits novos da main,
preservando os arquivos de teste em cada branch.

### 3. Criando Testes Automatizados

```bash
# Troca para a branch de teste desejada
git checkout cypress-tests  # ou playwright-tests ou selenium-tests

# NAO faca merge! Use o script se precisar atualizar
# scripts/git-helper.bat (opcao 7)

# Cria os testes
# ... edita arquivos na pasta de testes ...

# Commita e envia
git add .
git commit -m "test: adiciona testes para funcionalidade X"
git push origin cypress-tests
```

---

## Comandos para Executar Testes

### Cypress (branch: cypress-tests)
```bash
cd frontend
npx cypress open          # Interface grafica (recomendado para aprendizado)
npx cypress run           # Executa no terminal
npx cypress run --spec "cypress/e2e/api/*"  # Apenas testes de API
```

### Playwright (branch: playwright-tests)
```bash
cd frontend
npx playwright test                    # Executa todos os testes
npx playwright test --headed           # Com browser visivel
npx playwright test --project=chromium # Apenas Chrome
npx playwright show-report             # Ver relatorio HTML
```

### Selenium (branch: selenium-tests)
```bash
cd frontend/selenium
npm install              # Primeira vez apenas
npm test                 # Executa todos os testes
npm run test:api         # Apenas testes de API
npm run test:ui          # Apenas testes de UI
```

---

## Regras Importantes

1. **NUNCA** altere codigo da aplicacao (backend/frontend) nas branches de teste
2. **SEMPRE** desenvolva a aplicacao na branch `main`
3. **SEMPRE** use o script para atualizar as branches de teste
4. **NUNCA** use `git merge main` nas branches de teste (apaga os testes!)
5. Se encontrar um bug enquanto escreve testes:
   - Volte para `main`
   - Corrija o bug
   - Commit e push na `main`
   - Use o script (opcao 6 ou 7) para atualizar a branch de teste

---

## Diagrama Visual

```
                    ┌─────────────────────┐
                    │        main         │
                    │  (codigo fonte)     │
                    │  backend/ frontend/ │
                    └──────────┬──────────┘
                               │
                               │ cherry-pick (via script)
                               │ NAO use merge!
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  cypress-tests  │  │playwright-tests │  │ selenium-tests  │
│                 │  │                 │  │                 │
│ frontend/       │  │ frontend/       │  │ frontend/       │
│   cypress/      │  │   tests/        │  │   selenium/     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Iniciando o Projeto para Testes

Antes de executar qualquer teste, inicie a aplicacao:

**Terminal 1 - Backend:**
```bash
cd backend
npm install     # primeira vez
node src/server.js
# Rodando em http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install     # primeira vez
npm run dev
# Rodando em http://localhost:5173
```

**Terminal 3 - Testes:**
```bash
# Execute os testes conforme a branch que estiver
npx cypress open  # ou playwright test, etc.
```

---

## Menu do Script

```
============================================
       ProjectGO - Git Helper
============================================

  1) Ver status atual (branch e alteracoes)
  2) Trocar para branch main (desenvolvimento)
  3) Trocar para branch cypress-tests
  4) Trocar para branch playwright-tests
  5) Trocar para branch selenium-tests
  6) Atualizar TODAS as branches de teste com main
  7) Atualizar UMA branch de teste com main
  8) Ver commits pendentes para sincronizar
  9) Ver explicacao do fluxo de trabalho
  0) Sair
```
