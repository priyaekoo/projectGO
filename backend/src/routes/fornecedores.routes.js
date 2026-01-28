const express = require("express");
const router = express.Router();

const fornecedoresController = require("../controllers/fornecedores.controller");

// CRUD
router.post("/", fornecedoresController.criar);
router.get("/", fornecedoresController.listar);
router.get("/:id", fornecedoresController.consultarPorId);
router.patch("/:id", fornecedoresController.atualizar);
router.patch("/:id/inativar", fornecedoresController.inativar);
router.patch("/:id/reativar", fornecedoresController.reativar);

// FINANCEIRO
router.get("/:id/saldo", fornecedoresController.consultarSaldo);
router.get("/:id/extrato", fornecedoresController.extrato);

module.exports = router;
