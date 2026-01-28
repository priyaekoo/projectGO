const express = require("express");
const router = express.Router();

const relatoriosController = require("../controllers/relatorios.controller");

router.get("/resumo", relatoriosController.resumoGeral);
router.get("/movimentacoes-recentes", relatoriosController.movimentacoesRecentes);

module.exports = router;
