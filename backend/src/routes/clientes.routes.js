const express = require("express");
const router = express.Router();
const controller = require("../controllers/clientes.controller");

router.post("/", controller.criar);
router.get("/", controller.listar);
router.patch("/:id", controller.atualizar);
router.patch("/:id/inativar", controller.inativar);
router.patch("/:id/reativar", controller.reativar);

module.exports = router;
