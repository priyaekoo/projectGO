const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const { isValidCPF } = require("../utils/validators");

/**
 * Criar usuário
 */
exports.criar = async (req, res) => {
  const { nome_completo, email, cpf, senha, perfil } = req.body;

  // Validação básica de CPF
  if (!isValidCPF(cpf)) {
    return res.status(400).json({ erro: "CPF inválido" });
  }

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nome_completo, email, cpf, senha, perfil)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome_completo, email, cpf, perfil, ativo`,
      [nome_completo, email, cpf, senhaHash, perfil || 'operador'],
    );

    return res.status(201).json(result.rows[0]);
  } catch (erro) {
    // CPF ou EMAIL duplicado (unique constraint)
    if (erro.code === "23505") {
      return res.status(400).json({
        erro: "CPF ou e-mail já cadastrado",
      });
    }

    return res.status(500).json({
      erro: "Erro interno no servidor",
    });
  }
};

/**
 * Listar usuários (somente ativos)
 */
exports.consultar = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nome_completo,
        email,
        cpf,
        perfil,
        ativo,
        criado_em
      FROM usuarios
      ORDER BY nome_completo
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao consultar usuários",
    });
  }
};
/**
 * Atualizar usuário
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome_completo, email, cpf, perfil } = req.body;

  // Validação de CPF
  if (!isValidCPF(cpf)) {
    return res.status(400).json({ erro: "CPF inválido" });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET nome_completo = $1,
           email = $2,
           cpf = $3,
           perfil = $4
       WHERE id = $5
         AND ativo = true
       RETURNING id, nome_completo, email, cpf, perfil, ativo, criado_em`,
      [nome_completo, email, cpf, perfil || 'operador', id],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        erro: "Usuário inativo não pode ser editado",
      });
    }

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ erro: "E-mail já cadastrado" });
    }

    return res.status(500).json({ erro: "Erro ao atualizar usuário" });
  }
};

/**
 * Inativar usuário (soft delete)
 */
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET ativo = false
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.json({ mensagem: "Usuário inativado com sucesso" });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// rota de consulta por ID
exports.consultarPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nome_completo, email, cpf, perfil, ativo
       FROM usuarios
       WHERE id = $1
         AND ativo = true`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error); // 👈 importante
    return res.status(500).json({ erro: "Erro ao consultar usuário" });
  }
};
/**
 * Reativar usuário
 */
exports.reativar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET ativo = true
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.json({ mensagem: "Usuário reativado com sucesso" });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
