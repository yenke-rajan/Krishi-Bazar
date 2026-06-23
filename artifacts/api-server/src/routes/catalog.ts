import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db, catalogTable } from "@workspace/db";
import {
  GetCatalogResponse,
  CreateCatalogItemBody,
  UpdateCatalogItemParams,
  UpdateCatalogItemBody,
  UpdateCatalogItemResponse,
} from "@workspace/api-zod";
import { verifyToken, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function toUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

router.get("/catalog", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(catalogTable)
    .orderBy(catalogTable.crop_name);

  res.json(GetCatalogResponse.parse(items));
});

router.post(
  "/catalog",
  verifyToken,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const parsed = CreateCatalogItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { crop_name, crop_name_np, image_url, category } = parsed.data;
    const id = uuidv4();
    const now = toUnixSeconds();

    const [item] = await db
      .insert(catalogTable)
      .values({
        id,
        crop_name,
        crop_name_np,
        image_url: image_url ?? null,
        category: category as "VEGETABLE" | "PICKLE",
        is_available: true,
        created_at: now,
      })
      .returning();

    req.log.info({ itemId: item.id }, "Catalog item created");
    res.status(201).json(item);
  },
);

router.patch(
  "/catalog/:id",
  verifyToken,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const params = UpdateCatalogItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateCatalogItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const updateData: Partial<typeof catalogTable.$inferInsert> = {};
    if (parsed.data.crop_name !== undefined) updateData.crop_name = parsed.data.crop_name;
    if (parsed.data.crop_name_np !== undefined) updateData.crop_name_np = parsed.data.crop_name_np;
    if (parsed.data.image_url !== undefined) updateData.image_url = parsed.data.image_url;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category as "VEGETABLE" | "PICKLE";
    if (parsed.data.is_available !== undefined) updateData.is_available = parsed.data.is_available;

    const [item] = await db
      .update(catalogTable)
      .set(updateData)
      .where(eq(catalogTable.id, rawId))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Catalog item not found" });
      return;
    }

    res.json(UpdateCatalogItemResponse.parse(item));
  },
);

export default router;
