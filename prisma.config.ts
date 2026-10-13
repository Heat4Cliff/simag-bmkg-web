import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg",
  },
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg",
      });
      return new PrismaPg(pool);
    },
  },
});
