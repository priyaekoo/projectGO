const express = require("express");
const cors = require("cors");

const app = express();

// 🔓 libera CORS
app.use(cors());

// middlewares
app.use(express.json());

// =====================
// ROTAS DE AUTENTICAÇÃO
// =====================
app.use("/auth", require("./routes/auth.routes"));

// =====================
// ROTAS PRINCIPAIS
// =====================
app.use("/usuarios", require("./routes/usuarios.routes"));
app.use("/clientes", require("./routes/clientes.routes"));
app.use("/fornecedores", require("./routes/fornecedores.routes"));

// =====================
// UPLOAD
// =====================
app.use("/api", require("./routes/upload.routes"));

// =====================
// CONTAS A RECEBER
// =====================
app.use("/contas-receber", require("./routes/contasReceber.routes"));

// =====================
// DEPÓSITOS (ENTRADA DE SALDO)
// =====================
app.use("/depositos", require("./routes/depositos.routes"));

// contas a pagar
app.use("/contas-pagar", require("./routes/contasPagar.routes"));

// =====================
// TRANSFERENCIAS
// =====================
app.use("/transferencias", require("./routes/transferencias.routes"));

// =====================
// ESTORNOS
// =====================
app.use("/estornos", require("./routes/estornos.routes"));

// =====================
// RELATORIOS
// =====================
app.use("/relatorios", require("./routes/relatorios.routes"));

// =====================
// ROTA DE TESTE DO BANCO
// =====================
app.get("/db-test", async (req, res) => {
  const pool = require("./config/database");
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

module.exports = app;
