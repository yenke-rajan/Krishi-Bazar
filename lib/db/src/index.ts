import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function ensureSeedAdmin() {
  const [existing] = await db
    .select({ id: schema.usersTable.id })
    .from(schema.usersTable)
    .where(eq(schema.usersTable.phone, "9800000000"));

  if (existing) {
    return;
  }

  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!seedAdminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD must be set to seed the default admin user.");
  }

  const passwordHash = await bcrypt.hash(seedAdminPassword, 10);
  const now = Math.floor(Date.now() / 1000);

  await db.insert(schema.usersTable).values({
    id: uuidv4(),
    phone: "9800000000",
    password_hash: passwordHash,
    full_name: "Admin User",
    role: "ADMIN",
    created_at: now,
  });
}

export * from "./schema";
