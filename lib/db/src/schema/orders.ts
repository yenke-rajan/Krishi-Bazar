import { pgTable, text, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { catalogTable } from "./catalog";

export const layerTypeEnum = pgEnum("layer_type", ["SUPPLY", "DEMAND"]);
export const orderStatusEnum = pgEnum("order_status", [
  "ORDER_RECEIVED",
  "DISPATCHED_TO_COLLECT",
  "COLLECTED",
  "DISPATCHED",
  "DELIVERED",
]);

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  order_id: text("order_id").unique().notNull(),
  client_id: text("client_id")
    .notNull()
    .references(() => usersTable.id),
  crop_id: text("crop_id")
    .notNull()
    .references(() => catalogTable.id),
  weight_kg: real("weight_kg").notNull(),
  target_date_bs: text("target_date_bs").notNull(),
  layer_type: layerTypeEnum("layer_type").notNull(),
  status: orderStatusEnum("status").notNull().default("ORDER_RECEIVED"),
  notes: text("notes"),
  created_at: integer("created_at").notNull().default(0),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  order_id: true,
  client_id: true,
  created_at: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
