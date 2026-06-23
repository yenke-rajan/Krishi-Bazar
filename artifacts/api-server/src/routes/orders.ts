import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, sql, count } from "drizzle-orm";
import { db, ordersTable, usersTable, catalogTable } from "@workspace/db";
import {
  GetOrdersResponse,
  CreateOrderBody,
  GetOrderSummaryResponse,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { verifyToken, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function generateOrderId(): string {
  const prefix = "KB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

router.get("/orders/summary", verifyToken, async (req, res): Promise<void> => {
  const user = req.user!;

  let whereClause = undefined;
  if (user.role !== "ADMIN") {
    whereClause = eq(ordersTable.client_id, user.id);
  }

  const allOrders = await db
    .select({
      layer_type: ordersTable.layer_type,
      status: ordersTable.status,
    })
    .from(ordersTable)
    .where(whereClause);

  const total_orders = allOrders.length;
  const supply_orders = allOrders.filter((o) => o.layer_type === "SUPPLY").length;
  const demand_orders = allOrders.filter((o) => o.layer_type === "DEMAND").length;
  const order_received_count = allOrders.filter((o) => o.status === "ORDER_RECEIVED").length;
  const completed_count = allOrders.filter(
    (o) => o.status === "COLLECTED" || o.status === "DELIVERED",
  ).length;
  const active_count = total_orders - completed_count;

  res.json(
    GetOrderSummaryResponse.parse({
      total_orders,
      supply_orders,
      demand_orders,
      order_received_count,
      active_count,
      completed_count,
    }),
  );
});

router.get("/orders", verifyToken, async (req, res): Promise<void> => {
  const user = req.user!;

  let rows;

  if (user.role === "ADMIN") {
    rows = await db
      .select({
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
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.client_id, usersTable.id))
      .leftJoin(catalogTable, eq(ordersTable.crop_id, catalogTable.id))
      .orderBy(ordersTable.created_at);
  } else {
    rows = await db
      .select({
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
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.client_id, usersTable.id))
      .leftJoin(catalogTable, eq(ordersTable.crop_id, catalogTable.id))
      .where(eq(ordersTable.client_id, user.id))
      .orderBy(ordersTable.created_at);
  }

  res.json(GetOrdersResponse.parse(rows));
});

router.post("/orders", verifyToken, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { crop_id, weight_kg, target_date_bs, layer_type, notes } = parsed.data;
  const user = req.user!;

  const id = uuidv4();
  const order_id = generateOrderId();
  const now = toUnixSeconds();

  const [order] = await db
    .insert(ordersTable)
    .values({
      id,
      order_id,
      client_id: user.id,
      crop_id,
      weight_kg,
      target_date_bs,
      layer_type: layer_type as "SUPPLY" | "DEMAND",
      status: "ORDER_RECEIVED",
      notes: notes ?? null,
      created_at: now,
    })
    .returning();

  req.log.info({ orderId: order.order_id, userId: user.id }, "Order created");
  res.status(201).json(order);
});

router.patch(
  "/orders/:id/status",
  verifyToken,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const params = UpdateOrderStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateOrderStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const [order] = await db
      .update(ordersTable)
      .set({ status: parsed.data.status as typeof ordersTable.$inferInsert.status })
      .where(eq(ordersTable.id, rawId))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    req.log.info({ orderId: order.order_id, status: order.status }, "Order status updated");
    res.json(UpdateOrderStatusResponse.parse(order));
  },
);

export default router;
