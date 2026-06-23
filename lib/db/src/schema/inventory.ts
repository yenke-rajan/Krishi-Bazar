import { pgTable, text, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { catalogTable } from "./catalog";

export const trackingTypeEnum = pgEnum("tracking_type", [
  "RECEIVED",
  "DELIVERED",
]);

export const inventoryLedgerTable = pgTable("inventory_ledger", {
  id: text("id").primaryKey(),
  crop_id: text("crop_id")
    .notNull()
    .references(() => catalogTable.id),
  delta_quantity: real("delta_quantity").notNull(),
  tracking_type: trackingTypeEnum("tracking_type").notNull(),
  recorded_at: integer("recorded_at").notNull().default(0),
  notes: text("notes"),
});

export const insertInventorySchema = createInsertSchema(inventoryLedgerTable).omit({
  id: true,
  recorded_at: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryEntry = typeof inventoryLedgerTable.$inferSelect;
