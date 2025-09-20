import prisma from "../config/db-config.js";
import ApiError from "./api-error.js";
import jwt from "jsonwebtoken";

interface TokenDataProps {
  id: string;
  fullName: string;
  role: string;
}

export const generateAccessToken = async (data: TokenDataProps) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "1hr";

  if (!accessTokenSecret) {
    throw new ApiError(
      500,
      "Internal server error: access token secret not set"
    );
  }

  const accessToken = jwt.sign(
    {
      id: data.id,
      fullName: data.fullName,
      role: data.role,
    },
    accessTokenSecret,
    {
      expiresIn: accessTokenExpiry,
    }
  );

  return accessToken;
};

export const generateRefreshToken = async ({ id }: { id: string }) => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || "7d";

  if (!refreshTokenSecret) {
    throw new ApiError(
      500,
      "Internal server error: refresh token secret not set"
    );
  }

  const refreshToken = jwt.sign(
    {
      id,
    },
    refreshTokenSecret,
    {
      expiresIn: refreshTokenExpiry,
    }
  );

  return refreshToken;
};
