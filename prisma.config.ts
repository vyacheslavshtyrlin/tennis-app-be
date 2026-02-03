import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({
  path: process.env.NODE_ENV === 'production' ? '.env' : '.env.example',
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
