const express = require("express");
const router = express.Router();
const controller = require("../controllers/investimentos.controller");

router.get("/fundos", controller.listarFundos);
router.post("/aplicar", controller.aplicar);
router.post("/resgatar/:id", controller.resgatar);
router.get("/aplicacoes", controller.listarAplicacoes);
router.get("/rentabilidade/:id", controller.calcularRentabilidade);
router.get("/carteira/:id_cliente", controller.calcularCarteira);

module.exports = router;
