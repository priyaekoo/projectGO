const pool = require("../config/database");

/**
 * Importar transacoes externas (JSON do SPB)
 */
exports.importarTransacoesExternas = async (req, res) => {
  const { transacoes } = req.body;

  if (!transacoes || !Array.isArray(transacoes) || transacoes.length === 0) {
    return res.status(400).json({ erro: "Lista de transacoes vazia ou invalida" });
  }

  const resultados = [];

  for (const t of transacoes) {
    if (!t.codigo_externo || !t.tipo || !t.valor || !t.data_transacao) {
      resultados.push({
        codigo_externo: t.codigo_externo || "N/A",
        status: "ERRO",
        erro: "Campos obrigatorios faltando",
      });
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO transacoes_externas (codigo_externo, id_cliente, tipo, valor, descricao, data_transacao, origem)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [t.codigo_externo, t.id_cliente || null, t.tipo, t.valor, t.descricao || "", t.data_transacao, t.origem || "SPB"]
      );

      resultados.push({ codigo_externo: t.codigo_externo, status: "OK" });
    } catch (error) {
      if (error.code === "23505") {
        resultados.push({
          codigo_externo: t.codigo_externo,
          status: "ERRO",
          erro: "Codigo externo duplicado",
        });
      } else {
        resultados.push({
          codigo_externo: t.codigo_externo,
          status: "ERRO",
          erro: error.message,
        });
      }
    }
  }

  const total = resultados.length;
  const ok = resultados.filter((r) => r.status === "OK").length;

  return res.status(201).json({
    mensagem: `Importacao concluida: ${ok}/${total} transacoes importadas`,
    total,
    sucesso: ok,
    erros: total - ok,
    resultados,
  });
};

/**
 * Listar transacoes externas
 */
exports.listarTransacoesExternas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT te.*, c.nome_completo AS nome_cliente
      FROM transacoes_externas te
      LEFT JOIN clientes c ON c.id = te.id_cliente
      ORDER BY te.data_transacao DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar transacoes externas" });
  }
};

/**
 * Executar conciliacao automatica
 */
exports.executarConciliacao = async (req, res) => {
  try {
    // Buscar transacoes externas pendentes
    const externas = await pool.query(
      "SELECT * FROM transacoes_externas WHERE status = 'PENDENTE'"
    );

    if (externas.rowCount === 0) {
      return res.json({ mensagem: "Nenhuma transacao pendente para conciliar", total: 0 });
    }

    const resultados = [];

    for (const ext of externas.rows) {
      // Tentar encontrar movimentacao correspondente
      let query = `
        SELECT m.id, m.valor, m.tipo, m.data_movimentacao, m.descricao, m.id_cliente
        FROM movimentacoes m
        WHERE m.estornado = false
      `;
      const params = [];

      // Matching por cliente + valor + tipo
      if (ext.id_cliente) {
        params.push(ext.id_cliente);
        query += ` AND m.id_cliente = $${params.length}`;
      }

      // Matching por valor (tolerancia de 0.01)
      params.push(Number(ext.valor));
      query += ` AND ABS(m.valor - $${params.length}) < 0.02`;

      // Matching por tipo
      const tipoInterno = ext.tipo === "CREDITO" ? "ENTRADA" : "SAIDA";
      params.push(tipoInterno);
      query += ` AND m.tipo = $${params.length}`;

      // Matching por data (mesmo dia)
      params.push(ext.data_transacao);
      query += ` AND DATE(m.data_movimentacao) = DATE($${params.length})`;

      query += ` LIMIT 1`;

      const match = await pool.query(query, params);

      if (match.rowCount > 0) {
        const mov = match.rows[0];
        const diferenca = Math.abs(Number(ext.valor) - Number(mov.valor));

        let statusConc = "CONCILIADA";
        let tipoDivergencia = null;

        if (diferenca > 0.001) {
          statusConc = "DIVERGENTE";
          tipoDivergencia = "VALOR";
        }

        await pool.query(
          `INSERT INTO conciliacoes (id_transacao_externa, id_movimentacao, status, tipo_divergencia, valor_interno, valor_externo, diferenca)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ext.id, mov.id, statusConc, tipoDivergencia, mov.valor, ext.valor, diferenca]
        );

        // Atualizar status da transacao externa
        await pool.query(
          "UPDATE transacoes_externas SET status = $1 WHERE id = $2",
          [statusConc, ext.id]
        );

        resultados.push({
          codigo_externo: ext.codigo_externo,
          status: statusConc,
          diferenca: diferenca,
          id_movimentacao: mov.id,
        });
      } else {
        // Nao encontrou correspondencia
        await pool.query(
          `INSERT INTO conciliacoes (id_transacao_externa, status, tipo_divergencia, valor_externo)
           VALUES ($1, 'AUSENTE', 'SEM_CORRESPONDENCIA', $2)`,
          [ext.id, ext.valor]
        );

        await pool.query(
          "UPDATE transacoes_externas SET status = 'AUSENTE' WHERE id = $1",
          [ext.id]
        );

        resultados.push({
          codigo_externo: ext.codigo_externo,
          status: "AUSENTE",
          diferenca: null,
        });
      }
    }

    const conciliadas = resultados.filter((r) => r.status === "CONCILIADA").length;
    const divergentes = resultados.filter((r) => r.status === "DIVERGENTE").length;
    const ausentes = resultados.filter((r) => r.status === "AUSENTE").length;

    return res.json({
      mensagem: "Conciliacao executada",
      total: resultados.length,
      conciliadas,
      divergentes,
      ausentes,
      resultados,
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao executar conciliacao", detalhe: error.message });
  }
};

/**
 * Listar conciliacoes
 */
exports.listarConciliacoes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        co.*,
        te.codigo_externo,
        te.tipo AS tipo_externo,
        te.descricao AS descricao_externa,
        te.origem,
        m.descricao AS descricao_interna,
        m.origem AS origem_interna
      FROM conciliacoes co
      LEFT JOIN transacoes_externas te ON te.id = co.id_transacao_externa
      LEFT JOIN movimentacoes m ON m.id = co.id_movimentacao
      ORDER BY co.data_conciliacao DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar conciliacoes" });
  }
};

/**
 * Resumo da conciliacao
 */
exports.resumoConciliacao = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        status,
        COUNT(*) AS quantidade,
        COALESCE(SUM(ABS(diferenca)), 0) AS total_diferenca
      FROM conciliacoes
      GROUP BY status
    `);

    const resumo = {
      conciliadas: 0,
      divergentes: 0,
      ausentes: 0,
      total_diferenca: 0,
    };

    result.rows.forEach((r) => {
      if (r.status === "CONCILIADA") resumo.conciliadas = Number(r.quantidade);
      if (r.status === "DIVERGENTE") {
        resumo.divergentes = Number(r.quantidade);
        resumo.total_diferenca = Number(r.total_diferenca);
      }
      if (r.status === "AUSENTE") resumo.ausentes = Number(r.quantidade);
    });

    resumo.total = resumo.conciliadas + resumo.divergentes + resumo.ausentes;

    return res.json(resumo);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao gerar resumo" });
  }
};

/**
 * Gerar simulacao de transacoes externas para teste
 */
exports.gerarSimulacao = async (req, res) => {
  try {
    // Buscar movimentacoes recentes do sistema
    const movimentacoes = await pool.query(`
      SELECT m.id, m.id_cliente, m.tipo, m.valor, m.data_movimentacao, m.descricao
      FROM movimentacoes m
      WHERE m.estornado = false
      ORDER BY m.data_movimentacao DESC
      LIMIT 20
    `);

    if (movimentacoes.rowCount === 0) {
      return res.status(400).json({ erro: "Nenhuma movimentacao encontrada para gerar simulacao" });
    }

    const transacoes = [];
    let contador = 1;

    for (const mov of movimentacoes.rows) {
      const tipoExterno = mov.tipo === "ENTRADA" ? "CREDITO" : "DEBITO";
      let valor = Number(mov.valor);

      // Introduzir algumas divergencias aleatorias
      const random = Math.random();
      if (random < 0.15) {
        // 15%: divergencia de centavos
        valor = valor + (Math.random() * 0.50 - 0.25);
      } else if (random < 0.25) {
        // 10%: pular (nao incluir - simulando ausencia)
        continue;
      }

      transacoes.push({
        codigo_externo: `SPB-${Date.now()}-${contador}`,
        id_cliente: mov.id_cliente,
        tipo: tipoExterno,
        valor: Math.round(valor * 100) / 100,
        descricao: `Simulacao SPB: ${mov.descricao}`,
        data_transacao: mov.data_movimentacao,
        origem: "SPB",
      });

      contador++;
    }

    // Adicionar transacao que nao existe no sistema interno
    transacoes.push({
      codigo_externo: `SPB-${Date.now()}-EXTRA`,
      id_cliente: movimentacoes.rows[0].id_cliente,
      tipo: "CREDITO",
      valor: 999.99,
      descricao: "Transacao fantasma - nao existe internamente",
      data_transacao: new Date().toISOString(),
      origem: "SPB",
    });

    return res.json({
      mensagem: `Simulacao gerada com ${transacoes.length} transacoes`,
      transacoes,
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao gerar simulacao" });
  }
};
