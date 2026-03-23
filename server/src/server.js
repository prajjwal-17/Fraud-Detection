import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { seedDefaultUsers } from "./services/seed.service.js";

const bootstrap = async () => {
  await connectDb();
  await connectRedis();
  await seedDefaultUsers();

  const { server } = createApp();
  server.listen(env.port, () => {
    logger.info({ message: `Server listening on port ${env.port}` });
  });
};

bootstrap().catch((error) => {
  logger.error({ message: "Server bootstrap failed", error: error.message });
  process.exit(1);
});
