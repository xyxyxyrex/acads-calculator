import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";
import { URL } from "url";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in .env.local");
}

// Parse the database URL
const url = new URL(databaseUrl);

// Extract connection parameters
const dbParams = {
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  database: url.pathname.replace(/^\//, ""),
  user: url.username,
  password: url.password,
  ssl:
    url.searchParams.get("sslmode") === "require"
      ? { rejectUnauthorized: false }
      : false,
};

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: dbParams.host,
    port: dbParams.port,
    user: dbParams.user,
    password: dbParams.password,
    database: dbParams.database,
    ssl: dbParams.ssl,
  },
});
