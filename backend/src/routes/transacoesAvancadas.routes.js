const express = require("express");
const router = express.Router();
const controller = require("../controllers/transacoesAvancadas.controller");

router.get("/taxa", controller.consultarTaxa);
router.post("/alto-valor", controller.transferirAltoValor);
router.post("/lote", controller.transferirLote);
router.get("/", controller.listarTransacoesAvancadas);

module.exports = router;
