const pool = require("../config/database");

/**
 * Resumo financeiro geral
 */
exports.resumoGeral = async (req, res) => {
  try {
    // Total de clientes
    const clientesResult = await pool.query(
      "SELECT COUNT(*) as total FROM clientes WHERE ativo = true"
    );

    // Total de fornecedores
    const fornecedoresResult = await pool.query(
      "SELECT COUNT(*) as total FROM fornecedores WHERE ativo = true"
    );

    // Total em depositos
    const depositosResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM movimentacoes
       WHERE origem = 'DEPOSITO' AND estornado = false`
    );

    // Total em pagamentos (saidas de clientes)
    const pagamentosResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM movimentacoes
       WHERE origem = 'PAGAMENTO' AND tipo = 'SAIDA' AND estornado = false`
    );

    // Total em transferencias
    const transferenciasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM movimentacoes
       WHERE origem = 'TRANSFERENCIA' AND tipo = 'SAIDA' AND estornado = false`
    );

    // Contas a pagar pendentes
    const contasPagarResult = await pool.query(
      `SELECT COUNT(*) as quantidade, COALESCE(SUM(valor), 0) as total
       FROM contas_pagar WHERE status = 'PENDENTE'`
    );

    // Contas a receber pendentes
    const contasReceberResult = await pool.query(
      `SELECT COUNT(*) as quantidade, COALESCE(SUM(valor), 0) as total
       FROM contas_receber WHERE status = 'PENDENTE'`
    );

    // Saldo total dos clientes
    const saldoClientesResult = await pool.query(
      `SELECT COALESCE(SUM(
        cl.saldo_inicial +
        COALESCE((
          SELECT SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor ELSE -m.valor END)
          FROM movimentacoes m
          WHERE m.id_cliente = cl.id AND m.estornado = false
        ), 0)
      ), 0) as total
      FROM clientes cl WHERE cl.ativo = true`
    );

    // Saldo total dos fornecedores
    const saldoFornecedoresResult = await pool.query(
      `SELECT COALESCE(SUM(
        COALESCE((
          SELECT SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor ELSE -m.valor END)
          FROM movimentacoes m
          WHERE m.id_fornecedor = f.id AND m.estornado = false
        ), 0)
      ), 0) as total
      FROM fornecedores f WHERE f.ativo = true`
    );

    return res.json({
      clientes: {
        total: parseInt(clientesResult.rows[0].total),
        saldo_total: Number(saldoClientesResult.rows[0].total),
      },
      fornecedores: {
        total: parseInt(fornecedoresResult.rows[0].total),
        saldo_total: Number(saldoFornecedoresResult.rows[0].total),
      },
      movimentacoes: {
        depositos: Number(depositosResult.rows[0].total),
        pagamentos: Number(pagamentosResult.rows[0].total),
        transferencias: Number(transferenciasResult.rows[0].total),
      },
      contas_pagar: {
        quantidade: parseInt(contasPagarResult.rows[0].quantidade),
        valor_total: Number(contasPagarResult.rows[0].total),
      },
      contas_receber: {
        quantidade: parseInt(contasReceberResult.rows[0].quantidade),
        valor_total: Number(contasReceberResult.rows[0].total),
      },
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao gerar relatorio",
      detalhe: error.message,
    });
  }
};

/**
 * Movimentacoes recentes
 */
exports.movimentacoesRecentes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        m.id,
        m.tipo,
        m.valor,
        m.origem,
        m.descricao,
        m.data_movimentacao,
        m.estornado,
        c.nome_completo AS nome_cliente,
        f.nome_razao_social AS nome_fornecedor
      FROM movimentacoes m
      LEFT JOIN clientes c ON c.id = m.id_cliente
      LEFT JOIN fornecedores f ON f.id = m.id_fornecedor
      ORDER BY m.data_movimentacao DESC
      LIMIT 20`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao buscar movimentacoes",
    });
  }
};
