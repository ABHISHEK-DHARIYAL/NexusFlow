import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Load environment variables for PostgreSQL connection
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST && !process.env.DB_HOST.includes("localhost") 
    ? { rejectUnauthorized: false } 
    : undefined, // Enable SSL by default for production engines like Supabase/Neon
};

let poolInstance: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    if (!process.env.DB_HOST) {
      console.log("⚠️ DB_HOST is not set. Database connections will fall back to local JSON database emulator.");
    }
    poolInstance = new Pool(dbConfig);
    
    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client pool:", err);
    });
  }
  return poolInstance;
}

// Test connection
export async function testConnection(): Promise<boolean> {
  if (!process.env.DB_HOST) return false;
  try {
    const pool = getDbPool();
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Successfully connected to PostgreSQL / Supabase, timestamp: ", result.rows[0].now);
    return true;
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL / Supabase server: ", err);
    return false;
  }
}
