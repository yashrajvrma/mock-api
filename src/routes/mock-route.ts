import { Router } from "express";
import { verifyJWT } from "../middlewares/auth-middleware.js";
import mockController from "../controllers/mock/mock-controller.js";

const router = Router();

// all requests to /v1/api/mock/:chatId/... are protected
router.use("/", verifyJWT, mockController);

export default router;
