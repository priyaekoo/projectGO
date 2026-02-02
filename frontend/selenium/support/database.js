const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * Classe para gerenciar conexões com o banco de dados PostgreSQL
 * Usada para validar dados nos testes de integração (API + Banco)
 */
class Database {
  constructor() {
    this.pool = null;
  }

  /**
   * Conecta ao banco de dados
   * Usa as mesmas credenciais do backend
   */
  async connect() {
    if (!this.pool) {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '2436',
        database: process.env.DB_NAME || 'projectgo'
      });
    }
    return this.pool;
  }

  /**
   * Executa uma query no banco
   * @param {string} text - Query SQL
   * @param {Array} params - Parâmetros da query
   */
  async query(text, params = []) {
    const pool = await this.connect();
    return pool.query(text, params);
  }

  /**
   * Busca um cliente pelo CPF/CNPJ
   * @param {string} cpfCnpj - CPF ou CNPJ do cliente
   */
  async buscarClientePorCpfCnpj(cpfCnpj) {
    const result = await this.query(
      'SELECT * FROM clientes WHERE cpf_cnpj = $1',
      [cpfCnpj]
    );
    return result.rows[0] || null;
  }

  /**
   * Busca um cliente pelo ID
   * @param {number} id - ID do cliente
   */
  async buscarClientePorId(id) {
    const result = await this.query(
      'SELECT * FROM clientes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Deleta um cliente pelo CPF/CNPJ (usado para limpeza nos testes)
   * @param {string} cpfCnpj - CPF ou CNPJ do cliente
   */
  async deletarClientePorCpfCnpj(cpfCnpj) {
    await this.query(
      'DELETE FROM clientes WHERE cpf_cnpj = $1',
      [cpfCnpj]
    );
  }

  /**
   * Fecha a conexão com o banco
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = new Database();
