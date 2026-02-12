const pool = require("../config/database");

/**
 * Listar fundos de investimento
 */
exports.listarFundos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM fundos_investimento
      WHERE ativo = true
      ORDER BY nome
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar fundos" });
  }
};

/**
 * Aplicar em fundo
 */
exports.aplicar = async (req, res) => {
  const { id_cliente, id_fundo, valor } = req.body;

  if (!id_cliente || !id_fundo || !valor) {
    return res.status(400).json({ erro: "Cliente, fundo e valor sao obrigatorios" });
  }

  const valorNum = Number(valor);
  if (valorNum <= 0) {
    return res.status(400).json({ erro: "Valor deve ser maior que zero" });
  }

  // Valor minimo de aplicacao: R$ 100
  if (valorNum < 100) {
    return res.status(400).json({ erro: "Valor minimo de aplicacao: R$ 100,00" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar se fundo existe e esta ativo
    const fundo = await client.query(
      "SELECT * FROM fundos_investimento WHERE id = $1 AND ativo = true",
      [id_fundo]
    );

    if (fundo.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Fundo nao encontrado ou inativo" });
    }

    // Verificar saldo do cliente
    const saldoResult = await client.query(
      `SELECT
        cl.id,
        cl.saldo_inicial +
        COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor WHEN m.tipo = 'SAIDA' THEN -m.valor END), 0) AS saldo_atual
      FROM clientes cl
      LEFT JOIN movimentacoes m ON m.id_cliente = cl.id AND m.estornado = false
      WHERE cl.id = $1
      GROUP BY cl.id`,
      [id_cliente]
    );

    if (saldoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Cliente nao encontrado" });
    }

    const saldoAtual = Number(saldoResult.rows[0].saldo_atual);

    if (saldoAtual < valorNum) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erro: "Saldo insuficiente",
        saldo_atual: saldoAtual,
      });
    }

    // Criar aplicacao
    const aplicacao = await client.query(
      `INSERT INTO aplicacoes (id_cliente, id_fundo, valor_aplicado)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_cliente, id_fundo, valorNum]
    );

    // Debitar do saldo do cliente
    await client.query(
      `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
       VALUES ($1, 'SAIDA', $2, 'APLICACAO', $3)`,
      [id_cliente, valorNum, `Aplicacao em ${fundo.rows[0].nome}`]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      mensagem: "Aplicacao realizada com sucesso",
      aplicacao: aplicacao.rows[0],
      fundo: fundo.rows[0].nome,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ erro: "Erro ao realizar aplicacao" });
  } finally {
    client.release();
  }
};

/**
 * Resgatar investimento
 */
exports.resgatar = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Buscar aplicacao
    const aplicacao = await client.query(
      `SELECT a.*, f.nome AS nome_fundo, f.rentabilidade_anual, f.taxa_administracao, f.taxa_performance
       FROM aplicacoes a
       JOIN fundos_investimento f ON f.id = a.id_fundo
       WHERE a.id = $1 AND a.status = 'ATIVA'`,
      [id]
    );

    if (aplicacao.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Aplicacao nao encontrada ou ja resgatada" });
    }

    const app = aplicacao.rows[0];

    // Calcular rentabilidade
    const dataAplicacao = new Date(app.data_aplicacao);
    const agora = new Date();
    const diasInvestido = Math.floor((agora - dataAplicacao) / (1000 * 60 * 60 * 24));
    const rentAnual = Number(app.rentabilidade_anual) / 100;
    const rentDiaria = rentAnual / 252; // dias uteis
    const rendimento = Number(app.valor_aplicado) * rentDiaria * diasInvestido;

    // Descontar taxa de administracao
    const taxaAdmin = Number(app.taxa_administracao) / 100;
    const descontoAdmin = rendimento * taxaAdmin;

    // Taxa de performance (sobre o que exceder o benchmark)
    const taxaPerf = Number(app.taxa_performance) / 100;
    const descontoPerf = rendimento > 0 ? rendimento * taxaPerf : 0;

    const valorResgate = Number(app.valor_aplicado) + rendimento - descontoAdmin - descontoPerf;

    // Atualizar aplicacao
    await client.query(
      `UPDATE aplicacoes
       SET status = 'RESGATADA', data_resgate = NOW(), valor_resgate = $1
       WHERE id = $2`,
      [valorResgate, id]
    );

    // Creditar no saldo
    await client.query(
      `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
       VALUES ($1, 'ENTRADA', $2, 'RESGATE', $3)`,
      [app.id_cliente, valorResgate, `Resgate de ${app.nome_fundo} (${diasInvestido} dias)`]
    );

    await client.query("COMMIT");

    return res.json({
      mensagem: "Resgate realizado com sucesso",
      valor_aplicado: Number(app.valor_aplicado),
      dias_investido: diasInvestido,
      rendimento_bruto: rendimento,
      taxa_administracao: descontoAdmin,
      taxa_performance: descontoPerf,
      valor_resgate: valorResgate,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ erro: "Erro ao resgatar" });
  } finally {
    client.release();
  }
};

/**
 * Listar aplicacoes do cliente
 */
exports.listarAplicacoes = async (req, res) => {
  const { id_cliente } = req.query;

  try {
    let query = `
      SELECT
        a.*,
        f.nome AS nome_fundo,
        f.tipo AS tipo_fundo,
        f.rentabilidade_anual,
        f.benchmark,
        c.nome_completo AS nome_cliente
      FROM aplicacoes a
      JOIN fundos_investimento f ON f.id = a.id_fundo
      JOIN clientes c ON c.id = a.id_cliente
    `;

    const params = [];
    if (id_cliente) {
      params.push(id_cliente);
      query += ` WHERE a.id_cliente = $1`;
    }

    query += ` ORDER BY a.criado_em DESC`;

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar aplicacoes" });
  }
};

/**
 * Calcular rentabilidade de uma aplicacao
 */
exports.calcularRentabilidade = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT a.*, f.nome AS nome_fundo, f.rentabilidade_anual, f.benchmark,
              f.taxa_administracao, f.taxa_performance
       FROM aplicacoes a
       JOIN fundos_investimento f ON f.id = a.id_fundo
       WHERE a.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Aplicacao nao encontrada" });
    }

    const app = result.rows[0];
    const dataAplicacao = new Date(app.data_aplicacao);
    const dataRef = app.data_resgate ? new Date(app.data_resgate) : new Date();
    const diasInvestido = Math.floor((dataRef - dataAplicacao) / (1000 * 60 * 60 * 24));

    const rentAnual = Number(app.rentabilidade_anual) / 100;
    const rentDiaria = rentAnual / 252;
    const rendimentoBruto = Number(app.valor_aplicado) * rentDiaria * diasInvestido;

    const taxaAdmin = (rendimentoBruto * Number(app.taxa_administracao)) / 100;
    const taxaPerf = rendimentoBruto > 0 ? (rendimentoBruto * Number(app.taxa_performance)) / 100 : 0;

    const rendimentoLiquido = rendimentoBruto - taxaAdmin - taxaPerf;
    const valorAtual = Number(app.valor_aplicado) + rendimentoLiquido;
    const rentabilidadePercentual = (rendimentoLiquido / Number(app.valor_aplicado)) * 100;

    return res.json({
      aplicacao: app,
      dias_investido: diasInvestido,
      rendimento_bruto: rendimentoBruto,
      taxa_administracao: taxaAdmin,
      taxa_performance: taxaPerf,
      rendimento_liquido: rendimentoLiquido,
      valor_atual: valorAtual,
      rentabilidade_percentual: rentabilidadePercentual,
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao calcular rentabilidade" });
  }
};

/**
 * Calcular carteira total do cliente
 */
exports.calcularCarteira = async (req, res) => {
  const { id_cliente } = req.params;

  try {
    const result = await pool.query(
      `SELECT a.*, f.nome AS nome_fundo, f.tipo AS tipo_fundo,
              f.rentabilidade_anual, f.taxa_administracao, f.taxa_performance
       FROM aplicacoes a
       JOIN fundos_investimento f ON f.id = a.id_fundo
       WHERE a.id_cliente = $1 AND a.status = 'ATIVA'`,
      [id_cliente]
    );

    let totalAplicado = 0;
    let totalAtual = 0;
    const detalhes = [];

    for (const app of result.rows) {
      const dataAplicacao = new Date(app.data_aplicacao);
      const agora = new Date();
      const dias = Math.floor((agora - dataAplicacao) / (1000 * 60 * 60 * 24));

      const rentAnual = Number(app.rentabilidade_anual) / 100;
      const rentDiaria = rentAnual / 252;
      const rendimento = Number(app.valor_aplicado) * rentDiaria * dias;

      const taxaAdmin = (rendimento * Number(app.taxa_administracao)) / 100;
      const taxaPerf = rendimento > 0 ? (rendimento * Number(app.taxa_performance)) / 100 : 0;

      const valorAtual = Number(app.valor_aplicado) + rendimento - taxaAdmin - taxaPerf;

      totalAplicado += Number(app.valor_aplicado);
      totalAtual += valorAtual;

      detalhes.push({
        id: app.id,
        fundo: app.nome_fundo,
        tipo: app.tipo_fundo,
        valor_aplicado: Number(app.valor_aplicado),
        valor_atual: valorAtual,
        dias_investido: dias,
        rendimento_liquido: valorAtual - Number(app.valor_aplicado),
      });
    }

    return res.json({
      total_aplicado: totalAplicado,
      total_atual: totalAtual,
      rendimento_total: totalAtual - totalAplicado,
      rentabilidade_total: totalAplicado > 0 ? ((totalAtual - totalAplicado) / totalAplicado) * 100 : 0,
      quantidade_aplicacoes: result.rows.length,
      detalhes,
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao calcular carteira" });
  }
};
