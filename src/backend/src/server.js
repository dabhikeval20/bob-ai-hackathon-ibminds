const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');

async function startServer() {
  await connectDatabase(env.mongodbUri);
  return app.listen(env.port, env.host, () => {
    console.log(`SupplyGuard API listening on ${env.host}:${env.port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start SupplyGuard API', error.message);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
