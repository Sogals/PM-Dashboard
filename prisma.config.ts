import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'ts-node --compiler-options \'{"module":"CommonJS","target":"ES2022"}\' prisma/seed.ts',
  },
  datasource: {
    url: `file:${path.resolve(__dirname, "prisma/dev.db")}`,
  },
});
