const express = require("express");
const router = express.Router();

const contasReceberController = require("../controllers/contasReceber.controller");

// criar conta
router.post("/", contasReceberController.criar);

// listar contas
router.get("/", contasReceberController.listar);

// pagar conta
router.patch("/:id/pagar", contasReceberController.pagar);

module.exports = router;
