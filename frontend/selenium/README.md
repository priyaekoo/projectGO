# Selenium Tests - ProjectGO

Este diretorio contem os testes automatizados usando Selenium WebDriver.

## Estrutura

```
selenium/
├── fixtures/        # Dados de teste (JSON)
├── support/         # Helpers e utilitarios
├── tests/
│   ├── api/         # Testes de API
│   └── ui/          # Testes de interface
├── selenium.config.js
└── package.json
```

## Instalacao

```bash
cd frontend/selenium
npm install
```

## Execucao dos Testes

```bash
# Todos os testes
npm test

# Apenas testes de API
npm run test:api

# Apenas testes de UI
npm run test:ui
```

## Configuracao

Edite `selenium.config.js` para ajustar:
- URLs (baseUrl, apiUrl)
- Browser (chrome, firefox)
- Modo headless
- Timeouts

## Pre-requisitos

- Node.js 18+
- Chrome ou Firefox instalado
- Backend rodando em http://localhost:3000
- Frontend rodando em http://localhost:5173
