const express = require("express");
const router = express.Router();

const contasPagarController = require("../controllers/contasPagar.controller");

// criar conta a pagar
router.post("/", contasPagarController.criar);

// listar contas a pagar
router.get("/", contasPagarController.listar);

// atualizar conta (deve vir antes das rotas /:id/pagar e /:id/cancelar)
router.patch("/:id", contasPagarController.atualizar);

// pagar conta
router.patch("/:id/pagar", contasPagarController.pagar);

// cancelar conta
router.patch("/:id/cancelar", contasPagarController.cancelar);

module.exports = router;
