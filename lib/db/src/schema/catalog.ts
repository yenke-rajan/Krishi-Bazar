import { pgTable, text, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("category", ["VEGETABLE", "PICKLE"]);

export const catalogTable = pgTable("catalog", {
  id: text("id").primaryKey(),
  crop_name: text("crop_name").notNull(),
  crop_name_np: text("crop_name_np").notNull(),
  image_url: text("image_url"),
  category: categoryEnum("category").notNull(),
  is_available: boolean("is_available").notNull().default(true),
  created_at: integer("created_at").notNull().default(0),
});

export const insertCatalogSchema = createInsertSchema(catalogTable).omit({
  id: true,
  created_at: true,
});

export type InsertCatalogItem = z.infer<typeof insertCatalogSchema>;
export type CatalogItem = typeof catalogTable.$inferSelect;
