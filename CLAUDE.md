# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectGO is a full-stack financial management system for QA/testing practice. It consists of a Node.js/Express backend API and a React/Vite frontend. The application is in Portuguese (Brazilian market).

## Commands

### Backend (from `backend/` directory)
```bash
npm install              # Install dependencies
node src/server.js       # Start server on http://localhost:3000
```

### Frontend (from `frontend/` directory)
```bash
npm install              # Install dependencies
npm run dev              # Start dev server on http://localhost:5173
npm run build            # Production build
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Testing (from `frontend/` directory)
```bash
npx playwright test                      # Run all Playwright tests
npx playwright test tests/api/           # Run API tests only
npx playwright test --project=chromium   # Run on specific browser
npx playwright test --headed             # Run with browser visible
npx playwright show-report               # View HTML test report
```

## Architecture

### Backend (`backend/src/`)
- **Entry point**: `server.js` (port 3000)
- **App config**: `app.js` (Express middleware, CORS, routes)
- **Pattern**: Controllers handle business logic with raw SQL queries via `pg` pool
- **Auth**: JWT tokens (8-hour expiration), bcrypt password hashing
- **Database**: PostgreSQL (connection in `config/database.js`)

Key modules:
- `controllers/` - Business logic (auth, usuarios, clientes, fornecedores, contas, depositos, transferencias, estornos, relatorios)
- `routes/` - API endpoint definitions
- `config/` - Database pool and upload (Multer) configuration

### Frontend (`frontend/src/`)
- **Entry point**: `main.jsx`
- **Routing**: `routes/AppRoutes.jsx` with React Router
- **Auth guard**: `routes/PrivateRoute.jsx`
- **HTTP client**: `services/api.js` (Axios with JWT interceptor)
- **Pattern**: Feature-based pages with co-located CSS

Key directories:
- `pages/` - Feature pages (Login, Dashboard, Usuarios, Clientes, Fornecedores, ContasPagar, ContasReceber, Depositos, Transferencias, Relatorios)
- `components/` - Reusable components (Header, Menu)

### Data Flow
1. Frontend stores JWT in localStorage after login
2. Axios interceptor auto-injects `Authorization: Bearer {token}`
3. Backend validates JWT and performs database operations
4. Responses return JSON with data or error messages

## Database

PostgreSQL with environment variables in `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=2436
DB_NAME=projectgo
JWT_SECRET=projectgo_secret_123
```

## Key Patterns

### Backend
- **Soft delete**: Records marked `ativo=false` instead of deleted
- **CPF/CNPJ validation**: Using `cpf-cnpj-validator` package
- **SQL error handling**: Error code 23505 for unique constraint violations
- **Transactional operations**: BEGIN/COMMIT/ROLLBACK for financial operations

### Frontend
- **Controlled forms**: useState for form fields
- **Modal pattern**: Overlay modals for CRUD operations
- **Client-side validation**: CPF format, email, password strength
- **Status management**: Loading, error, success states in components

## API Endpoints

```
POST /auth/login           - Authentication (returns JWT)
/usuarios                  - User management (CRUD)
/clientes                  - Customer management + /saldo, /extrato
/fornecedores              - Supplier management + /saldo, /extrato
/contas-receber            - Accounts receivable
/contas-pagar              - Accounts payable (validates client balance)
/depositos                 - Deposits (adds to client balance)
/transferencias            - Transfers between clients
/estornos/:id              - Reverse a transaction
/relatorios/resumo         - Financial summary
/relatorios/movimentacoes-recentes - Recent transactions
```

## Testing

Tests are in `frontend/tests/` using Playwright:
- API tests validate authentication and business logic
- Fixtures in `frontend/fixtures/` contain test data
- Tests run against `http://localhost:3000` (backend must be running)
