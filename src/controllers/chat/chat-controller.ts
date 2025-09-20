import type { Request, Response } from "express";
import ApiError from "../../utils/api-error.js";
import prisma from "../../config/db.js";

import ApiResponse from "../../utils/api-response.js";
import AsyncHandler from "../../utils/async-handler.js";

import { GoogleGenAI } from "@google/genai";

export const createChat = AsyncHandler(async (req, res) => {
  const userId = req.user?.id!;

  const { message } = req.body;
  console.log("message is", message);

  if (!message) {
    throw new ApiError(400, "Chat Id is required");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a short title based on the user prompt. 
    USER_PROMPT : ${message}
    `,
  });

  console.log("title is", response.text);

  const title = response.text;

  const chat = await prisma.chat.create({
    data: {
      userId,
      title: title!,
    },
    select: {
      id: true,
      title: true,
    },
  });

  const chatId = chat.id;

  const saveUserMessage = await prisma.message.create({
    data: {
      chatId: chatId,
      content: message as string,
      role: "USER",
    },
  });

  return res.json(
    new ApiResponse(200, {
      chatId: chatId,
      title: chat.title,
    })
  );
});
