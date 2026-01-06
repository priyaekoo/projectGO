const express = require("express");
const controller = require("../controllers/pacientes.controller");

const router = express.Router();

router.post("/", controller.criar);
router.get("/", controller.consultar);
router.patch("/:id", controller.atualizar);
router.delete("/:id", controller.deletar);

module.exports = router;
