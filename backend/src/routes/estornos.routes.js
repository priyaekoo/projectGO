const express = require("express");
const router = express.Router();

const estornosController = require("../controllers/estornos.controller");

router.post("/:id", estornosController.estornar);

module.exports = router;
