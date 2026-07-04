import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable, ordersTable } from "@workspace/db";
import { verifyToken, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const ACTIVE_STATUSES = ["ORDER_RECEIVED", "DISPATCHED_TO_COLLECT", "DISPATCHED"] as const;

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function userToPublic(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    phone: user.phone,
    full_name: user.full_name,
    email: user.email ?? null,
    role: user.role,
    primary_address: user.primary_address ?? null,
    created_at: user.created_at,
  };
}

router.get("/users", verifyToken, requireRole("ADMIN"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.created_at));
  res.json(users.map(userToPublic));
});

router.patch("/users/me", verifyToken, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const { full_name, email, primary_address } = req.body;

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (full_name !== undefined) updateData.full_name = String(full_name).trim();
  if (email !== undefined) updateData.email = email ? String(email).trim() : null;
  if (primary_address !== undefined) updateData.primary_address = primary_address ? String(primary_address).trim() : null;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  req.log.info({ userId }, "User profile updated");
  res.json(userToPublic(updated));
});

router.post("/users", verifyToken, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const { phone, password, full_name, email, role, primary_address } = req.body;

  if (!phone || !password || !full_name || !role) {
    res.status(400).json({ error: "phone, password, full_name, and role are required" });
    return;
  }

  if (!/^(97|98)\d{8}$/.test(phone)) {
    res.status(400).json({ error: "Invalid phone number — must be 10 digits starting with 97 or 98" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.phone, phone));
  if (existing) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      id: uuidv4(),
      phone,
      password_hash,
      full_name,
      email: email ?? null,
      role: role as "FARMER" | "WHOLESALER" | "ADMIN",
      primary_address: primary_address ?? null,
      created_at: toUnixSeconds(),
    })
    .returning();

  req.log.info({ userId: user.id, role: user.role }, "Admin created user");
  res.status(201).json(userToPublic(user));
});

router.delete("/users/:id", verifyToken, requireRole("ADMIN"), async (req, res): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const adminId = req.user!.id;

    if (rawId === adminId) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }

    const [targetUser] = await db.select({ id: usersTable.id, full_name: usersTable.full_name })
      .from(usersTable)
      .where(eq(usersTable.id, rawId));

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check for active (non-terminal) orders
    const activeOrders = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(
        eq(ordersTable.user_id, rawId)
      )
      .then((rows) => rows.filter((r) => ACTIVE_STATUSES.includes((r as any).status)));

    // Re-query with status to properly filter
    const allUserOrders = await db
      .select({ id: ordersTable.id, status: ordersTable.status })
      .from(ordersTable)
      .where(eq(ordersTable.user_id, rawId));

    const hasActiveOrders = allUserOrders.some((o) =>
      ACTIVE_STATUSES.includes(o.status as typeof ACTIVE_STATUSES[number])
    );

    if (hasActiveOrders) {
      res.status(409).json({
        error: "Cannot delete this user — they have orders currently in progress. Wait for all their orders to be completed first.",
      });
      return;
    }

    // Delete completed orders first to satisfy the FK constraint
    if (allUserOrders.length > 0) {
      await db.delete(ordersTable).where(eq(ordersTable.user_id, rawId));
    }

    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, rawId)).returning();
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.log.info({ deletedUserId: rawId }, "Admin deleted user");
    res.json({ message: "User deleted successfully" });
  } catch (err: any) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user. Please try again." });
  }
});

router.patch("/users/:id/role", verifyToken, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role } = req.body;

  if (!role || !["FARMER", "WHOLESALER", "ADMIN"].includes(role)) {
    res.status(400).json({ error: "Valid role is required (FARMER, WHOLESALER, ADMIN)" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: role as "FARMER" | "WHOLESALER" | "ADMIN" })
    .where(eq(usersTable.id, rawId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  req.log.info({ userId: user.id, newRole: user.role }, "Admin changed user role");
  res.json(userToPublic(user));
});

export default router;
