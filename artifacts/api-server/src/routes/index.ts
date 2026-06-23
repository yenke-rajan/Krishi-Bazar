import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import catalogRouter from "./catalog";
import ordersRouter from "./orders";
import inventoryRouter from "./inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(catalogRouter);
router.use(ordersRouter);
router.use(inventoryRouter);

export default router;
