import { verifyJWT } from "./../middlewares/auth-middleware.js";
import { Router } from "express";

import { createChat } from "../controllers/chat/chat-controller.js";

const router = Router();

router.route("/create-chat").post(verifyJWT, createChat);

export default router;
