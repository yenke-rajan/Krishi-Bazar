import { pgTable, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["FARMER", "WHOLESALER", "ADMIN"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  full_name: text("full_name").notNull(),
  email: text("email"),
  role: roleEnum("role").notNull(),
  primary_address: text("primary_address"),
  created_at: integer("created_at").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  password_hash: true,
  created_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
