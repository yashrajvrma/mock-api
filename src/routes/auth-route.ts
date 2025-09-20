import { verifyJWT } from "./../middlewares/auth-middleware.js";
import { Router } from "express";
import {
  refreshAccessToken,
  signIn,
  signUp,
} from "../controllers/user/auth-controller.js";

const router = Router();

router.route("/signin").post(signIn);
router.route("/signup").post(signUp);
router.route("/refresh-token").get(refreshAccessToken);

export default router;
