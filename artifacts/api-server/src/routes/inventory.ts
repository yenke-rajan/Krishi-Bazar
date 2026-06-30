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
  const result = await db.execute(sql`
    SELECT
      c.id AS crop_id,
      c.crop_name,
      c.crop_name_np,
      c.category,
      COALESCE(s.to_receive, 0)::float AS to_receive,
      COALESCE(d.to_deliver, 0)::float AS to_deliver,
      GREATEST(COALESCE(w.in_warehouse, 0), 0)::float AS in_warehouse,
      w.last_updated,
      last_il.tracking_type AS last_entry_type
    FROM catalog c
    LEFT JOIN (
      SELECT crop_id, SUM(weight_kg) AS to_receive
      FROM orders
      WHERE layer_type = 'SUPPLY' AND status IN ('ORDER_RECEIVED', 'DISPATCHED_TO_COLLECT')
      GROUP BY crop_id
    ) s ON s.crop_id = c.id
    LEFT JOIN (
      SELECT crop_id, SUM(weight_kg) AS to_deliver
      FROM orders
      WHERE layer_type = 'DEMAND' AND status IN ('ORDER_RECEIVED', 'DISPATCHED')
      GROUP BY crop_id
    ) d ON d.crop_id = c.id
    LEFT JOIN (
      SELECT
        crop_id,
        SUM(CASE WHEN tracking_type = 'RECEIVED' THEN delta_quantity ELSE 0 END) -
        SUM(CASE WHEN tracking_type = 'DELIVERED' THEN delta_quantity ELSE 0 END) AS in_warehouse,
        MAX(recorded_at) AS last_updated
      FROM inventory_ledger
      GROUP BY crop_id
    ) w ON w.crop_id = c.id
    LEFT JOIN LATERAL (
      SELECT tracking_type
      FROM inventory_ledger
      WHERE crop_id = c.id
      ORDER BY recorded_at DESC
      LIMIT 1
    ) last_il ON true
    ORDER BY c.crop_name
  `);

  return (result.rows as any[]).map((row) => {
    const to_receive = Number(row.to_receive ?? 0);
    const to_deliver = Number(row.to_deliver ?? 0);
    const in_warehouse = Math.max(0, Number(row.in_warehouse ?? 0));
    return {
      crop_id: row.crop_id as string,
      crop_name: row.crop_name as string,
      crop_name_np: row.crop_name_np as string,
      category: row.category as string,
      to_receive,
      to_deliver,
      in_warehouse,
      needed: to_deliver - in_warehouse,
      last_updated: row.last_updated ? Number(row.last_updated) : null,
      last_entry_type: (row.last_entry_type as string | null) ?? null,
    };
  });
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
    available_kg: s.in_warehouse,
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
