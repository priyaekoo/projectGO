const express = require("express");
const router = express.Router();

const clientesController = require("../controllers/clientes.controller");

// CRUD
router.post("/", clientesController.criar);
router.get("/", clientesController.listar);
router.patch("/:id", clientesController.atualizar);
router.patch("/:id/inativar", clientesController.inativar);
router.patch("/:id/reativar", clientesController.reativar);

// 💰 FINANCEIRO
router.get("/:id/saldo", clientesController.consultarSaldo);
router.get("/:id/extrato", clientesController.extrato);
router.get("/:id/saldo", clientesController.consultarSaldo);

module.exports = router;
