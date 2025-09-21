import { verifyJWT } from "./../middlewares/auth-middleware.js";
import { Router } from "express";
import { createChat, fetchChatMessages, } from "../controllers/chat/chat-controller.js";
const router = Router();
router.route("/create-chat").post(verifyJWT, createChat);
router.route("/").post(verifyJWT, fetchChatMessages);
export default router;
//# sourceMappingURL=chat-routes.js.map