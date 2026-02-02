const { BeforeAll, AfterAll, setDefaultTimeout } = require('@cucumber/cucumber');
const database = require('./database');

/**
 * Hooks Globais do Cucumber
 *
 * BeforeAll: Executa UMA vez antes de todos os cenários
 * AfterAll: Executa UMA vez depois de todos os cenários
 */

// Define timeout padrão para os steps (30 segundos)
setDefaultTimeout(30000);

BeforeAll(async function () {
  console.log('\n🚀 Iniciando suíte de testes BDD...');
  console.log('📦 Conectando ao banco de dados...');

  // Testa conexão com o banco
  try {
    await database.connect();
    const result = await database.query('SELECT NOW()');
    console.log(`✅ Banco conectado: ${result.rows[0].now}`);
  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error.message);
    throw error;
  }
});

AfterAll(async function () {
  console.log('\n🧹 Finalizando testes...');
  console.log('📦 Fechando conexão com banco de dados...');

  await database.disconnect();

  console.log('✅ Testes finalizados!\n');
});
