import express from "express";
import prisma from "../../config/db.js";
import ApiError from "../../utils/api-error.js";

const router = express.Router();

/**
 * Serve a mock API response
 * Example: GET /v1/api/mock/:chatId/users
 */
// router.all("/:chatId/:path(*)", async (req, res, next) => {
//   try {
//     const userId = req.user!.id; // from auth middleware
//     const { chatId, path } = req.params;

//     // normalize the requested path
//     const fullPath = "/" + path; // e.g. "users" → "/users"

//     // Find matching mock route
//     const mock = await prisma.mockRoute.findFirst({
//       where: {
//         userId,
//         chatId: chatId as string,
//         path: fullPath,
//         method: req.method, // exact match on HTTP method
//       },
//     });

//     if (!mock) {
//       throw new ApiError(
//         404,
//         `No mock route found for ${req.method} ${fullPath}`
//       );
//     }

//     // Return stored JSON response
//     res.json(mock.response);
//   } catch (err) {
//     next(err);
//   }
// });

// // This will capture everything after :chatId into req.params.path
// router.all("/:chatId/*rest", async (req, res, next) => {
//   try {
//     const userId = req.user!.id; // from auth middleware
//     const { chatId, rest } = req.params;

//     // normalize the requested path
//     const fullPath = rest ? `/${rest}` : "/";

//     // Find matching mock route in DB
//     const mock = await prisma.mockRoute.findFirst({
//       where: {
//         userId,
//         chatId: chatId as string,
//         path: fullPath,
//         method: req.method, // must match GET/POST/etc.
//       },
//     });

//     if (!mock) {
//       throw new ApiError(
//         404,
//         `No mock route found for ${req.method} ${fullPath}`
//       );
//     }

//     // Return stored JSON response
//     res.json(mock.response);
//   } catch (err) {
//     next(err);
//   }
// });

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

    res.json(mock.response);
  } catch (err) {
    next(err);
  }
});

export default router;
