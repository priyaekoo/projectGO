const pool = require("../config/database");
const { cpf, cnpj } = require("cpf-cnpj-validator");

/**
 * Criar cliente
 */
exports.criar = async (req, res) => {
  const { nome_completo, email, cpf_cnpj, observacao } = req.body;

  if (!cpf_cnpj) {
    return res.status(400).json({ erro: "CPF ou CNPJ é obrigatório" });
  }

  if (!cpf.isValid(cpf_cnpj) && !cnpj.isValid(cpf_cnpj)) {
    return res.status(400).json({ erro: "CPF ou CNPJ inválido" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes
       (nome_completo, email, cpf_cnpj, observacao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome_completo, email, cpf_cnpj, observacao, ativo, criado_em`,
      [nome_completo, email, cpf_cnpj, observacao],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        erro: "CPF ou CNPJ já cadastrado",
      });
    }

    return res.status(500).json({
      erro: "Erro ao criar cliente",
    });
  }
};

/**
 * Listar clientes
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nome_completo,
        email,
        cpf_cnpj,
        observacao,
        ativo,
        criado_em
      FROM clientes
      ORDER BY nome_completo
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar clientes",
    });
  }
};

/**
 * Atualizar cliente (PATCH)
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome_completo, email, cpf_cnpj, observacao, ...rest } = req.body;

  // Bloqueia campos não permitidos
  if (Object.keys(rest).length > 0) {
    return res.status(400).json({
      erro: "Campo não permitido para atualização",
    });
  }

  try {
    const cliente = await pool.query(
      `SELECT ativo FROM clientes WHERE id = $1`,
      [id],
    );

    if (cliente.rowCount === 0) {
      return res.status(404).json({
        erro: "Cliente não encontrado",
      });
    }

    if (!cliente.rows[0].ativo) {
      return res.status(400).json({
        erro: "Cliente inativo não pode ser alterado",
      });
    }

    // Valida CPF/CNPJ somente se enviado
    if (cpf_cnpj) {
      if (!cpf.isValid(cpf_cnpj) && !cnpj.isValid(cpf_cnpj)) {
        return res.status(400).json({ erro: "CPF ou CNPJ inválido" });
      }
    }

    const campos = [];
    const valores = [];
    let index = 1;

    if (nome_completo) {
      campos.push(`nome_completo = $${index++}`);
      valores.push(nome_completo);
    }

    if (email) {
      campos.push(`email = $${index++}`);
      valores.push(email);
    }

    if (cpf_cnpj) {
      campos.push(`cpf_cnpj = $${index++}`);
      valores.push(cpf_cnpj);
    }

    if (observacao) {
      campos.push(`observacao = $${index++}`);
      valores.push(observacao);
    }

    if (campos.length === 0) {
      return res.status(400).json({
        erro: "Nenhum campo válido enviado para atualização",
      });
    }

    valores.push(id);

    const result = await pool.query(
      `UPDATE clientes
       SET ${campos.join(", ")}
       WHERE id = $${index}
       RETURNING id, nome_completo, email, cpf_cnpj, observacao, ativo, criado_em`,
      valores,
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao atualizar cliente",
    });
  }
};

/**
 * Inativar cliente (soft delete)
 */
exports.inativar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET ativo = false
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Cliente não encontrado",
      });
    }

    return res.json({
      mensagem: "Cliente inativado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao inativar cliente",
    });
  }
};

/**
 * Reativar cliente
 */
exports.reativar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET ativo = true
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Cliente não encontrado",
      });
    }

    return res.json({
      mensagem: "Cliente reativado com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao reativar cliente",
    });
  }
};
