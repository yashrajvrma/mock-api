import ApiError from "../utils/api-error.js";
import AsyncHandler from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

interface User {
  id: string;
  email: string;
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const verifyJWT = AsyncHandler(async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    console.log("token is", token);

    if (!token) {
      throw new ApiError(
        401,
        "Unauthorised request, please provide access token"
      );
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET!;

    if (!accessTokenSecret) {
      throw new ApiError(
        500,
        "Internal server error: access token secret not set"
      );
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as jwt.JwtPayload;

    let user: User | null;

    if (typeof decodedToken != "string" && "id" in decodedToken) {
      // @ts-ignore
      user = await prisma.user.findUnique({
        where: {
          id: decodedToken.id as string,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      });
    } else {
      throw new ApiError(401, "Invalid access token");
    }

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(401, error.message || "Internal Server Error");
    } else {
      throw new ApiError(401, "JWT token expired");
    }
  }
});
