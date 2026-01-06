const express = require("express");
const app = express();

app.use(express.json());

app.use("/usuarios", require("./routes/usuarios.routes"));
app.use("/pacientes", require("./routes/pacientes.routes"));

app.get("/db-test", async (req, res) => {
  const pool = require("./config/database");
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

module.exports = app;
