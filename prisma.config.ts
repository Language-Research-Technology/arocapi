import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: 'prisma',
  engine: 'classic',
  datasource: {
    // provider: "mysql",
    url: env('DATABASE_URL'),
  },
});
