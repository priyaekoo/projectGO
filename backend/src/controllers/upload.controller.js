const fs = require("fs");
const path = require("path");

exports.uploadArquivo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: "Nenhum arquivo enviado" });
  }

  return res.status(201).json({
    mensagem: "Upload realizado com sucesso",
    arquivo: req.file.filename,
  });
};

exports.excluirArquivo = (req, res) => {
  const { nomeArquivo } = req.params;

  const caminho = path.resolve(__dirname, "..", "uploads", nomeArquivo);

  if (!fs.existsSync(caminho)) {
    return res.status(404).json({ erro: "Arquivo não encontrado" });
  }

  fs.unlinkSync(caminho);

  return res.json({ mensagem: "Arquivo excluído com sucesso" });
};
