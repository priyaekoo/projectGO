const pool = require("../config/database");

/**
 * Verificar se mercado esta aberto
 */
const verificarMercadoAberto = async () => {
  const config = await pool.query("SELECT chave, valor FROM config_mercado");
  const configMap = {};
  config.rows.forEach((r) => { configMap[r.chave] = r.valor; });

  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const horaAtual = hora * 60 + minuto;

  const [aberturaH, aberturaM] = configMap.MERCADO_ABERTURA.split(":").map(Number);
  const [fechamentoH, fechamentoM] = configMap.MERCADO_FECHAMENTO.split(":").map(Number);

  const abertura = aberturaH * 60 + aberturaM;
  const fechamento = fechamentoH * 60 + fechamentoM;

  // Verificar dia da semana
  const diasUteis = configMap.MERCADO_DIAS_UTEIS || "SEG,TER,QUA,QUI,SEX";
  const diasMap = { 0: "DOM", 1: "SEG", 2: "TER", 3: "QUA", 4: "QUI", 5: "SEX", 6: "SAB" };
  const diaSemana = diasMap[agora.getDay()];
  const diaUtil = diasUteis.includes(diaSemana);

  const dentroHorario = horaAtual >= abertura && horaAtual < fechamento;

  return {
    aberto: diaUtil && dentroHorario,
    hora_atual: `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`,
    abertura: configMap.MERCADO_ABERTURA,
    fechamento: configMap.MERCADO_FECHAMENTO,
    dia_semana: diaSemana,
    dia_util: diaUtil,
  };
};

/**
 * Consultar status do mercado
 */
exports.consultarMercado = async (req, res) => {
  try {
    const status = await verificarMercadoAberto();
    return res.json(status);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao consultar mercado" });
  }
};

/**
 * Listar ativos disponiveis
 */
exports.listarAtivos = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ativos WHERE ativo = true ORDER BY codigo"
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar ativos" });
  }
};

/**
 * Criar ordem de compra/venda
 */
exports.criarOrdem = async (req, res) => {
  const { id_cliente, id_ativo, tipo, quantidade, preco_unitario } = req.body;

  if (!id_cliente || !id_ativo || !tipo || !quantidade || !preco_unitario) {
    return res.status(400).json({ erro: "Todos os campos sao obrigatorios" });
  }

  if (!["COMPRA", "VENDA"].includes(tipo)) {
    return res.status(400).json({ erro: "Tipo deve ser COMPRA ou VENDA" });
  }

  const qtd = Number(quantidade);
  const preco = Number(preco_unitario);

  if (qtd <= 0 || preco <= 0) {
    return res.status(400).json({ erro: "Quantidade e preco devem ser maiores que zero" });
  }

  // Verificar lote padrao (multiplo de 100 para acoes)
  const ativo = await pool.query("SELECT * FROM ativos WHERE id = $1", [id_ativo]);
  if (ativo.rowCount === 0) {
    return res.status(404).json({ erro: "Ativo nao encontrado" });
  }

  if (ativo.rows[0].tipo === "ACAO" && qtd % 100 !== 0) {
    return res.status(400).json({
      erro: "Quantidade deve ser multiplo de 100 (lote padrao B3)",
    });
  }

  // Verificar horario de mercado
  const mercado = await verificarMercadoAberto();
  if (!mercado.aberto) {
    return res.status(400).json({
      erro: "Mercado fechado. Horario de funcionamento: " + mercado.abertura + " - " + mercado.fechamento,
      mercado,
    });
  }

  const valorTotal = qtd * preco;

  // Para compra, verificar saldo
  if (tipo === "COMPRA") {
    const saldoResult = await pool.query(
      `SELECT
        cl.saldo_inicial +
        COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor WHEN m.tipo = 'SAIDA' THEN -m.valor END), 0) AS saldo_atual
      FROM clientes cl
      LEFT JOIN movimentacoes m ON m.id_cliente = cl.id AND m.estornado = false
      WHERE cl.id = $1
      GROUP BY cl.id`,
      [id_cliente]
    );

    if (saldoResult.rowCount === 0) {
      return res.status(404).json({ erro: "Cliente nao encontrado" });
    }

    const saldo = Number(saldoResult.rows[0].saldo_atual);
    if (saldo < valorTotal) {
      return res.status(400).json({
        erro: "Saldo insuficiente para esta ordem",
        saldo_atual: saldo,
        valor_ordem: valorTotal,
      });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO ordens (id_cliente, id_ativo, tipo, quantidade, preco_unitario, valor_total)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_cliente, id_ativo, tipo, qtd, preco, valorTotal]
    );

    return res.status(201).json({
      mensagem: "Ordem criada com sucesso",
      ordem: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao criar ordem" });
  }
};

/**
 * Listar ordens
 */
exports.listarOrdens = async (req, res) => {
  const { id_cliente } = req.query;

  try {
    let query = `
      SELECT o.*, a.codigo AS codigo_ativo, a.nome AS nome_ativo,
             c.nome_completo AS nome_cliente
      FROM ordens o
      JOIN ativos a ON a.id = o.id_ativo
      JOIN clientes c ON c.id = o.id_cliente
    `;

    const params = [];
    if (id_cliente) {
      params.push(id_cliente);
      query += ` WHERE o.id_cliente = $1`;
    }

    query += ` ORDER BY o.data_criacao DESC`;

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar ordens" });
  }
};

/**
 * Cancelar ordem
 */
exports.cancelarOrdem = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE ordens SET status = 'CANCELADA'
       WHERE id = $1 AND status = 'PENDENTE'
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ erro: "Ordem nao encontrada ou nao pode ser cancelada" });
    }

    return res.json({ mensagem: "Ordem cancelada", ordem: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao cancelar ordem" });
  }
};

/**
 * Executar ordem (simulacao)
 */
exports.executarOrdem = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ordem = await client.query(
      `SELECT o.*, a.codigo, a.nome AS nome_ativo, a.preco_atual
       FROM ordens o
       JOIN ativos a ON a.id = o.id_ativo
       WHERE o.id = $1 AND o.status = 'PENDENTE'`,
      [id]
    );

    if (ordem.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erro: "Ordem nao encontrada ou nao esta pendente" });
    }

    const o = ordem.rows[0];

    // Verificar variacao de preco (rejeitar se variou mais que 5%)
    const precoAtual = Number(o.preco_atual);
    const precoOrdem = Number(o.preco_unitario);
    const variacao = Math.abs((precoAtual - precoOrdem) / precoOrdem) * 100;

    if (variacao > 5) {
      await client.query(
        `UPDATE ordens SET status = 'REJEITADA', motivo_rejeicao = $1
         WHERE id = $2`,
        [`Variacao de preco acima de 5% (${variacao.toFixed(2)}%)`, id]
      );
      await client.query("COMMIT");
      return res.status(400).json({
        erro: "Ordem rejeitada por variacao de preco",
        variacao: variacao.toFixed(2) + "%",
      });
    }

    // Executar
    if (o.tipo === "COMPRA") {
      // Debitar do cliente
      await client.query(
        `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
         VALUES ($1, 'SAIDA', $2, 'ORDEM_COMPRA', $3)`,
        [o.id_cliente, Number(o.valor_total), `Compra de ${o.quantidade}x ${o.codigo}`]
      );
    } else {
      // Creditar no cliente
      await client.query(
        `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
         VALUES ($1, 'ENTRADA', $2, 'ORDEM_VENDA', $3)`,
        [o.id_cliente, Number(o.valor_total), `Venda de ${o.quantidade}x ${o.codigo}`]
      );
    }

    await client.query(
      `UPDATE ordens SET status = 'EXECUTADA', data_execucao = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      mensagem: "Ordem executada com sucesso",
      tipo: o.tipo,
      ativo: o.codigo,
      quantidade: o.quantidade,
      valor_total: Number(o.valor_total),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ erro: "Erro ao executar ordem" });
  } finally {
    client.release();
  }
};
