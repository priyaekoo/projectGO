const express = require("express");
const cors = require("cors");

const app = express();

// 🔓 libera CORS
app.use(cors());

// middlewares
app.use(express.json());
app.use("/auth", require("./routes/auth.routes"));

// rotas
app.use("/usuarios", require("./routes/usuarios.routes"));
app.use("/pacientes", require("./routes/pacientes.routes"));
app.use("/api", require("./routes/upload.routes"));

app.get("/db-test", async (req, res) => {
  const pool = require("./config/database");
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

module.exports = app;
