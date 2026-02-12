const express = require("express");
const router = express.Router();
const controller = require("../controllers/conciliacao.controller");

router.post("/importar", controller.importarTransacoesExternas);
router.get("/externas", controller.listarTransacoesExternas);
router.post("/executar", controller.executarConciliacao);
router.get("/", controller.listarConciliacoes);
router.get("/resumo", controller.resumoConciliacao);
router.post("/simular", controller.gerarSimulacao);

module.exports = router;
