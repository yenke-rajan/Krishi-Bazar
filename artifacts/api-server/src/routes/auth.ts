import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  GetMeResponse,
} from "@workspace/api-zod";
import { verifyToken, signToken } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function userToResponse(user: typeof usersTable.$inferSelect) {
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

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phone, password, full_name, email, role, primary_address } = parsed.data;

  if (!/^(97|98)\d{8}$/.test(phone)) {
    res.status(400).json({ error: "Invalid phone number — must be 10 digits starting with 97 or 98" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.phone, phone));

  if (existing) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const now = toUnixSeconds();

  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      phone,
      password_hash,
      full_name,
      email: email ?? null,
      role: role as "FARMER" | "WHOLESALER",
      primary_address: primary_address ?? null,
      created_at: now,
    })
    .returning();

  const token = signToken({
    id: user.id,
    role: user.role,
    full_name: user.full_name,
    phone: user.phone,
  });

  req.log.info({ userId: user.id, role: user.role }, "User registered");
  res.status(201).json({ token, user: userToResponse(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phone, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone));

  if (!user) {
    res.status(401).json({ error: "Incorrect phone number or password" });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ error: "Incorrect phone number or password" });
    return;
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    full_name: user.full_name,
    phone: user.phone,
  });

  req.log.info({ userId: user.id, role: user.role }, "User logged in");
  res.json({ token, user: userToResponse(user) });
});

router.get("/auth/me", verifyToken, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(userToResponse(user)));
});

export default router;
