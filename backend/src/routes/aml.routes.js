const express = require("express");
const router = express.Router();
const amlController = require("../controllers/aml.controller");

// Clientes PEP
router.get("/clientes-pep", amlController.listarClientesPEP);
router.patch("/clientes/:id/pep", amlController.marcarClientePEP);

// Investigacoes
router.post("/investigacoes", amlController.criarInvestigacao);
router.get("/investigacoes", amlController.listarInvestigacoes);
router.get("/investigacoes/:id", amlController.consultarInvestigacao);
router.patch("/investigacoes/:id", amlController.atualizarInvestigacao);

// Audit Log
router.get("/audit-log", amlController.auditLog);

module.exports = router;
