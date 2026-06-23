import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, sql } from "drizzle-orm";
import { db, inventoryLedgerTable, catalogTable } from "@workspace/db";
import {
  GetInventoryResponse,
  LogInventoryBody,
} from "@workspace/api-zod";
import { verifyToken, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

router.get("/inventory", verifyToken, async (_req, res): Promise<void> => {
  const crops = await db
    .select()
    .from(catalogTable)
    .orderBy(catalogTable.crop_name);

  const stockRows = await Promise.all(
    crops.map(async (crop) => {
      const receivedResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryLedgerTable.tracking_type} = 'RECEIVED' THEN ${inventoryLedgerTable.delta_quantity} ELSE 0 END), 0)`,
        })
        .from(inventoryLedgerTable)
        .where(eq(inventoryLedgerTable.crop_id, crop.id));

      const deliveredResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryLedgerTable.tracking_type} = 'DELIVERED' THEN ${inventoryLedgerTable.delta_quantity} ELSE 0 END), 0)`,
        })
        .from(inventoryLedgerTable)
        .where(eq(inventoryLedgerTable.crop_id, crop.id));

      const totalReceived = Number(receivedResult[0]?.total ?? 0);
      const totalDelivered = Number(deliveredResult[0]?.total ?? 0);
      const available_kg = Math.max(0, totalReceived - totalDelivered);

      return {
        crop_id: crop.id,
        crop_name: crop.crop_name,
        crop_name_np: crop.crop_name_np,
        category: crop.category,
        available_kg,
      };
    }),
  );

  res.json(GetInventoryResponse.parse(stockRows));
});

router.post(
  "/inventory",
  verifyToken,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const parsed = LogInventoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { crop_id, delta_quantity, tracking_type, notes } = parsed.data;

    const [entry] = await db
      .insert(inventoryLedgerTable)
      .values({
        id: uuidv4(),
        crop_id,
        delta_quantity,
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
