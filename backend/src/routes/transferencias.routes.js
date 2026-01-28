const express = require("express");
const router = express.Router();

const transferenciasController = require("../controllers/transferencias.controller");

router.post("/", transferenciasController.transferir);
router.get("/", transferenciasController.listar);

module.exports = router;
