import type { Request, Response } from "express";
import {
  userSignInSchema,
  userSignUpSchema,
} from "../../schema/auth-schema.js";
import ApiError from "../../utils/api-error.js";
import bcrypt from "bcrypt";
import prisma from "../../config/db-config.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generate-token.js";
import ApiResponse from "../../utils/api-response.js";
import { saltRounds } from "../../utils/constants/index.js";
import AsyncHandler from "../../utils/async-handler.js";
import jwt, { decode } from "jsonwebtoken";

export const signIn = AsyncHandler(async (req, res) => {
  console.log("BODY =>", req.body);

  const { phoneNum, password } = userSignInSchema.parse(req.body);

  console.log(phoneNum, password);

  if (!phoneNum) {
    throw new ApiError(400, "Mobile number is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const isValidUser = await prisma.user.findUnique({
    where: {
      phoneNum,
    },
    select: {
      id: true,
      fullName: true,
      phoneNum: true,
      password: true,
      role: true,
    },
  });

  if (!isValidUser) {
    throw new ApiError(400, `No account found with ${phoneNum}`);
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
    fullName: isValidUser.fullName,
    role: isValidUser.role,
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
      role: isValidUser.role,
      accessToken: accessToken,
    })
  );
});

export const signUp = AsyncHandler(async (req, res) => {
  const { fullName, phoneNum, password, role } = userSignUpSchema.parse(
    req.body
  );

  const isExistingUser = await prisma.user.findUnique({
    where: {
      phoneNum,
    },
  });

  if (isExistingUser) {
    throw new ApiError(400, `User already exists with Mobile no ${phoneNum}`);
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      phoneNum,
      password: hashedPassword,
      role,
    },
  });

  const accessToken = await generateAccessToken({
    id: newUser.id,
    fullName: newUser.fullName,
    role: newUser.role,
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
        phoneNum: newUser.phoneNum,
        role: newUser.role,
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
    fullName: user.fullName,
    role: user.role,
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
