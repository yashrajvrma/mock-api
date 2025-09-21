import { verifyJWT } from "./../middlewares/auth-middleware.js";
import { Router } from "express";
import { createChat, fetchAllChatMsg, fetchChatMessages, } from "../controllers/chat/chat-controller.js";
const router = Router();
router.route("/create-chat").post(verifyJWT, createChat);
// router.route("/fetch-message").post(verifyJWT, fetchChatMessages);
router.route("/fetch-msg").get(verifyJWT, fetchAllChatMsg);
export default router;
//# sourceMappingURL=chat-routes.js.map