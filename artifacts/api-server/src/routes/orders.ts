import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, usersTable, catalogTable } from "@workspace/db";
import { verifyToken, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function generateOrderId(layerType: "SUPPLY" | "DEMAND"): string {
  const prefix = layerType === "SUPPLY" ? "KBF" : "KBW";
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${prefix}-${ts}${rand}`;
}

const ORDER_SELECT = {
  id: ordersTable.id,
  order_id: ordersTable.order_id,
  client_id: ordersTable.client_id,
  crop_id: ordersTable.crop_id,
  weight_kg: ordersTable.weight_kg,
  target_date_bs: ordersTable.target_date_bs,
  layer_type: ordersTable.layer_type,
  status: ordersTable.status,
  notes: ordersTable.notes,
  created_at: ordersTable.created_at,
  client_name: usersTable.full_name,
  client_phone: usersTable.phone,
  client_address: usersTable.primary_address,
  crop_name: catalogTable.crop_name,
  crop_name_np: catalogTable.crop_name_np,
};

router.get("/orders/summary", verifyToken, async (req, res): Promise<void> => {
  const user = req.user!;
  const allOrders = user.role === "ADMIN"
    ? await db.select({ layer_type: ordersTable.layer_type, status: ordersTable.status }).from(ordersTable)
    : await db.select({ layer_type: ordersTable.layer_type, status: ordersTable.status }).from(ordersTable).where(eq(ordersTable.client_id, user.id));

  const total_orders = allOrders.length;
  const supply_orders = allOrders.filter((o) => o.layer_type === "SUPPLY").length;
  const demand_orders = allOrders.filter((o) => o.layer_type === "DEMAND").length;
  const order_received_count = allOrders.filter((o) => o.status === "ORDER_RECEIVED").length;
  const completed_count = allOrders.filter((o) => o.status === "COLLECTED" || o.status === "DELIVERED").length;
  const active_count = total_orders - completed_count;

  res.json({ total_orders, supply_orders, demand_orders, order_received_count, active_count, completed_count });
});

router.get("/orders/my", verifyToken, async (req, res): Promise<void> => {
  const user = req.user!;
  const rows = await db
    .select(ORDER_SELECT)
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.client_id, usersTable.id))
    .leftJoin(catalogTable, eq(ordersTable.crop_id, catalogTable.id))
    .where(eq(ordersTable.client_id, user.id))
    .orderBy(desc(ordersTable.created_at));
  res.json(rows);
});

router.get("/orders/all", verifyToken, requireRole("ADMIN"), async (_req, res): Promise<void> => {
  const rows = await db
    .select(ORDER_SELECT)
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.client_id, usersTable.id))
    .leftJoin(catalogTable, eq(ordersTable.crop_id, catalogTable.id))
    .orderBy(desc(ordersTable.created_at));
  res.json(rows);
});

router.get("/orders", verifyToken, async (req, res): Promise<void> => {
  const user = req.user!;
  const baseQuery = db
    .select(ORDER_SELECT)
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.client_id, usersTable.id))
    .leftJoin(catalogTable, eq(ordersTable.crop_id, catalogTable.id));

  const rows = user.role === "ADMIN"
    ? await baseQuery.orderBy(desc(ordersTable.created_at))
    : await baseQuery.where(eq(ordersTable.client_id, user.id)).orderBy(desc(ordersTable.created_at));

  res.json(rows);
});

router.post("/orders", verifyToken, async (req, res): Promise<void> => {
  const { crop_id, weight_kg, target_date_bs, notes } = req.body;
  if (!crop_id || weight_kg == null || !target_date_bs) {
    res.status(400).json({ error: "crop_id, weight_kg, and target_date_bs are required" });
    return;
  }

  const user = req.user!;
  if (user.role === "ADMIN") {
    res.status(403).json({ error: "Admins cannot place orders" });
    return;
  }

  const layer_type: "SUPPLY" | "DEMAND" = user.role === "FARMER" ? "SUPPLY" : "DEMAND";
  const order_id = generateOrderId(layer_type);
  const id = uuidv4();
  const now = toUnixSeconds();

  const [order] = await db
    .insert(ordersTable)
    .values({
      id,
      order_id,
      client_id: user.id,
      crop_id,
      weight_kg: Number(weight_kg),
      target_date_bs,
      layer_type,
      status: "ORDER_RECEIVED",
      notes: notes ?? null,
      created_at: now,
    })
    .returning();

  req.log.info({ orderId: order.order_id, userId: user.id, layerType: layer_type }, "Order created");
  res.status(201).json(order);
});

router.patch("/orders/:id/status", verifyToken, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [order] = await db
    .update(ordersTable)
    .set({ status: status as typeof ordersTable.$inferInsert.status })
    .where(eq(ordersTable.id, rawId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  req.log.info({ orderId: order.order_id, status: order.status }, "Order status updated");
  res.json(order);
});

export default router;
