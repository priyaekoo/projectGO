const express = require("express");
const router = express.Router();

const contasPagarController = require("../controllers/contasPagar.controller");

// criar conta a pagar
router.post("/", contasPagarController.criar);

// listar contas a pagar
router.get("/", contasPagarController.listar);

// pagar conta
router.patch("/:id/pagar", contasPagarController.pagar);

// cancelar conta
router.patch("/:id/cancelar", contasPagarController.cancelar);

module.exports = router;
