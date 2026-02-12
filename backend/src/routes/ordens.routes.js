const express = require("express");
const router = express.Router();
const controller = require("../controllers/ordens.controller");

router.get("/mercado", controller.consultarMercado);
router.get("/ativos", controller.listarAtivos);
router.post("/", controller.criarOrdem);
router.get("/", controller.listarOrdens);
router.patch("/:id/cancelar", controller.cancelarOrdem);
router.post("/:id/executar", controller.executarOrdem);

module.exports = router;
