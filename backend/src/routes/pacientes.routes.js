const express = require("express");
const controller = require("../controllers/pacientes.controller");

const router = express.Router();

router.post("/", controller.criar);
router.get("/", controller.consultar);

module.exports = router;
