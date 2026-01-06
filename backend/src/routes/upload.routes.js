const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const uploadController = require("../controllers/upload.controller");

router.post(
  "/upload",
  upload.single("arquivo"),
  uploadController.uploadArquivo
);

router.delete("/upload/:nomeArquivo", uploadController.excluirArquivo);

module.exports = router;
