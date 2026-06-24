import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, sql, desc } from "drizzle-orm";
import { db, inventoryLedgerTable, catalogTable } from "@workspace/db";
import { verifyToken, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function buildStockSummary() {
  const crops = await db.select().from(catalogTable).orderBy(catalogTable.crop_name);
  return Promise.all(
    crops.map(async (crop) => {
      const [row] = await db
        .select({
          received: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryLedgerTable.tracking_type} = 'RECEIVED' THEN ${inventoryLedgerTable.delta_quantity} ELSE 0 END), 0)`,
          delivered: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryLedgerTable.tracking_type} = 'DELIVERED' THEN ${inventoryLedgerTable.delta_quantity} ELSE 0 END), 0)`,
          last_updated: sql<number | null>`MAX(${inventoryLedgerTable.recorded_at})`,
        })
        .from(inventoryLedgerTable)
        .where(eq(inventoryLedgerTable.crop_id, crop.id));

      const [lastEntry] = await db
        .select({ tracking_type: inventoryLedgerTable.tracking_type })
        .from(inventoryLedgerTable)
        .where(eq(inventoryLedgerTable.crop_id, crop.id))
        .orderBy(desc(inventoryLedgerTable.recorded_at))
        .limit(1);

      const received_total = Number(row?.received ?? 0);
      const delivered_total = Number(row?.delivered ?? 0);
      return {
        crop_id: crop.id,
        crop_name: crop.crop_name,
        crop_name_np: crop.crop_name_np,
        category: crop.category,
        received_total,
        delivered_total,
        available_stock: Math.max(0, received_total - delivered_total),
        last_updated: row?.last_updated ?? null,
        last_entry_type: lastEntry?.tracking_type ?? null,
      };
    }),
  );
}

router.get("/inventory/summary", verifyToken, async (_req, res): Promise<void> => {
  const summary = await buildStockSummary();
  res.json(summary);
});

router.get("/inventory/history", verifyToken, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const entries = await db
    .select({
      id: inventoryLedgerTable.id,
      crop_id: inventoryLedgerTable.crop_id,
      crop_name: catalogTable.crop_name,
      crop_name_np: catalogTable.crop_name_np,
      delta_quantity: inventoryLedgerTable.delta_quantity,
      tracking_type: inventoryLedgerTable.tracking_type,
      recorded_at: inventoryLedgerTable.recorded_at,
      notes: inventoryLedgerTable.notes,
    })
    .from(inventoryLedgerTable)
    .leftJoin(catalogTable, eq(inventoryLedgerTable.crop_id, catalogTable.id))
    .orderBy(desc(inventoryLedgerTable.recorded_at))
    .limit(limit);
  res.json(entries);
});

router.get("/inventory", verifyToken, async (_req, res): Promise<void> => {
  const summary = await buildStockSummary();
  res.json(summary.map((s) => ({
    crop_id: s.crop_id,
    crop_name: s.crop_name,
    crop_name_np: s.crop_name_np,
    category: s.category,
    available_kg: s.available_stock,
  })));
});

router.post(
  "/inventory",
  verifyToken,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { crop_id, delta_quantity, tracking_type, notes } = req.body;
    if (!crop_id || delta_quantity == null || !tracking_type) {
      res.status(400).json({ error: "crop_id, delta_quantity, and tracking_type are required" });
      return;
    }

    const [entry] = await db
      .insert(inventoryLedgerTable)
      .values({
        id: uuidv4(),
        crop_id,
        delta_quantity: Number(delta_quantity),
        tracking_type: tracking_type as "RECEIVED" | "DELIVERED",
        recorded_at: toUnixSeconds(),
        notes: notes ?? null,
      })
      .returning();

    req.log.info({ entryId: entry.id, trackingType: entry.tracking_type }, "Inventory logged");
    res.status(201).json(entry);
  },
);

export default router;
