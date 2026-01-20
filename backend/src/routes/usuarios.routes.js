const express = require("express");
const controller = require("../controllers/usuarios.controller");

const router = express.Router();

router.post("/", controller.criar);
router.get("/", controller.consultar);
router.patch("/:id", controller.atualizar);
router.delete("/:id", controller.deletar);
router.patch("/:id/reativar", controller.reativar);

// 🔽 NOVA ROTA (consulta por ID)
router.get("/:id", controller.consultarPorId);

module.exports = router;
