import { verifyJWT } from "./../middlewares/auth-middleware.js";
import { Router } from "express";
import { generateMsg } from "../controllers/message/message-controller.js";
const router = Router();
router.route("/generate").post(verifyJWT, generateMsg);
export default router;
//# sourceMappingURL=message-route.js.map