import type { Request, Response } from "express";
import ApiError from "../../utils/api-error.js";
import bcrypt from "bcrypt";
import prisma from "../../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generate-token.js";
import ApiResponse from "../../utils/api-response.js";
import AsyncHandler from "../../utils/async-handler.js";
import jwt, { decode } from "jsonwebtoken";

export const signIn = AsyncHandler(async (req, res) => {
  console.log("BODY =>", req.body);

  const { email, password } = req.body;

  console.log(email, password);

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const isValidUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      password: true,
    },
  });

  if (!isValidUser) {
    throw new ApiError(400, `No account found with ${email}`);
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    isValidUser.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  const accessToken = await generateAccessToken({
    id: isValidUser.id,
    email: isValidUser.email,
  });

  const refreshToken = await generateRefreshToken({
    id: isValidUser.id,
  });

  await prisma.user.update({
    where: {
      id: isValidUser.id,
    },
    data: {
      refreshToken,
    },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 1000,
  });

  return res.json(
    new ApiResponse(200, {
      fullName: isValidUser.fullName,
      email: isValidUser.email,
      accessToken: accessToken,
    })
  );
});

export const signUp = AsyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  const isExistingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isExistingUser) {
    throw new ApiError(400, `User already exists with Mobile no ${email}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = await generateAccessToken({
    id: newUser.id,
    email: newUser.email,
  });

  const refreshToken = await generateRefreshToken({
    id: newUser.id,
  });

  await prisma.user.update({
    where: {
      id: newUser.id,
    },
    data: {
      refreshToken,
    },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json(
    new ApiResponse(
      200,
      {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        accessToken,
      },
      "User creaated successfully"
    )
  );
});

export const refreshAccessToken = AsyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Unauthorised request");
  }

  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET!;

  const decodedToken = jwt.verify(token, refreshTokenSecret) as jwt.JwtPayload;

  if (!decodedToken || !decodedToken.id) {
    throw new ApiError(400, "Invalid refresh token");
  }

  console.log("decode data is", JSON.stringify(decodedToken));

  const user = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (token != user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired");
  }

  const accessToken = await generateAccessToken({
    id: user.id,
    email: user.email,
  });

  const refreshToken = await generateRefreshToken({
    id: user.id,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json(
    new ApiResponse(
      200,
      {
        accessToken,
      },
      "Refresh token loaded successfully"
    )
  );
});
