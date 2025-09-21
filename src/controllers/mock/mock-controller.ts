import express, { response } from "express";
import prisma from "../../config/db.js";
import ApiError from "../../utils/api-error.js";
import ApiResponse from "../../utils/api-response.js";
import AsyncHandler from "../../utils/async-handler.js";

const router = express.Router();

router.all("/:chatId/*rest", async (req, res, next) => {
  try {
    const userId = req.user!.id; // from auth middleware

    // cast req.params to "any" or record
    const { chatId } = req.params as { chatId: string; rest?: string };

    const fullPath = (req.params as any).rest
      ? "/" + (req.params as any).rest
      : "/";

    const mock = await prisma.mockRoute.findFirst({
      where: {
        userId,
        chatId,
        path: fullPath,
        method: req.method,
      },
    });

    if (!mock) {
      throw new ApiError(
        404,
        `No mock route found for ${req.method} ${fullPath}`
      );
    }

    // res.json(mock.response);
    return res.json(
      new ApiResponse(200, {
        chatId,
        id: mock.id,
        path: mock.path,
        method: mock.method,
        response: mock.response,
      })
    );
  } catch (err) {
    next(err);
  }
});

export const fetchMockApi = AsyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    throw new ApiError(400, "Chat Id is required");
  }

  const userId = req.user?.id!;

  const fetchAllApi = await prisma.mockRoute.findMany({
    where: {
      userId,
      chatId: chatId as string,
    },
    select: {
      id: true,
      chatId: true,
      method: true,
      path: true,
    },
  });

  return res.json(new ApiResponse(200, fetchAllApi));
});

export default router;
