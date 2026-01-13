const pool = require("../config/database");
const { isValidCPF } = require("../utils/validators");

/**
 * Criar paciente
 */
exports.criar = async (req, res) => {
  const { nome_completo, cpf, email, observacao } = req.body;

  // validar CPF
  if (!isValidCPF(cpf)) {
    return res.status(400).json({ erro: "CPF inválido" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pacientes (nome_completo, cpf, email, observacao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome_completo, cpf, email, observacao, ativo, criado_em`,
      [nome_completo, cpf, email, observacao]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ erro: "CPF já cadastrado" });
    }

    return res.status(500).json({
      erro: "Erro interno ao cadastrar paciente",
    });
  }
};
/**
 * Listar pacientes (somente ativos)
 */
exports.consultar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome_completo, cpf
       FROM pacientes
       WHERE ativo = true`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

/**
 * Consultar paciente por CPF (caso de uso real)
 */
exports.consultarPorCpf = async (req, res) => {
  const { cpf } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM pacientes
       WHERE cpf = $1
         AND ativo = true`,
      [cpf]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

/**
 * Atualizar paciente
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome_completo, email, observacao } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pacientes
       SET nome_completo = $1,
           email = $2,
           observacao = $3
       WHERE id = $4
         AND ativo = true
       RETURNING id, nome_completo, cpf, email, observacao`,
      [nome_completo, email, observacao, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    return res.status(200).json({
      mensagem: "Paciente atualizado com sucesso",
      paciente: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

/**
 * Inativar paciente (soft delete)
 */
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE pacientes
       SET ativo = false
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    return res.json({ mensagem: "Paciente inativado com sucesso" });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
