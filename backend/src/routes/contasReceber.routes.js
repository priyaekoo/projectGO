const express = require("express");
const router = express.Router();
const controller = require("../controllers/contasReceber.controller");

router.post("/", controller.criar);
router.post("/:id/pagar", controller.pagar);
router.post("/:id/cancelar", controller.cancelar);
router.get("/", controller.listar);

module.exports = router;
