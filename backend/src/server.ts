import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Bike Rental API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}

start();
