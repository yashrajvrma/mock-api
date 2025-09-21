import type { Request, Response } from "express";
import ApiError from "../../utils/api-error.js";
import prisma from "../../config/db.js";
import ApiResponse from "../../utils/api-response.js";
import AsyncHandler from "../../utils/async-handler.js";
import {
  GoogleGenAI,
  Type,
  type FunctionCall,
  type FunctionDeclaration,
} from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const createChat = AsyncHandler(async (req, res) => {
  const userId = req.user?.id!;

  const { message } = req.body;
  console.log("message is", message);

  if (!message) {
    throw new ApiError(400, "Chat Id is required");
  }

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

export const fetchChatMessages = AsyncHandler(async (req, res) => {
  const { chatId } = req.query;

  const userId = req.user?.id!;

  if (!chatId) {
    throw new ApiError(400, "Chat id is required");
  }

  const isChatIdValid = await prisma.chat.findUnique({
    where: {
      id: chatId as string,
      userId: userId,
    },
  });

  if (!chatId) {
    throw new ApiError(400, "Invalid chatId");
  }

  const messages = await prisma.message.findMany({
    where: {
      chatId: chatId as string,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log("messages is", messages);

  let contents;

  if (!messages || messages.length === 0) {
    throw new ApiError(400, "No chat messages exist");
  }

  if (messages.length === 1 && messages[0]?.role === "USER") {
    // const userMe
    // contents
    contents = [
      {
        role: "user",
        parts: [
          {
            text: messages,
          },
        ],
      },
    ];

    return res.json(
      new ApiResponse(200, {
        messages,
      })
    );
  } else {
    return res.json(
      new ApiResponse(200, {
        messages,
      })
    );
  }
});

// export const generateMsg = AsyncHandler(async (req, res) => {
//   const { chatId, message, role } = req.body;

//   const userId = req.user?.id!;

//   if (!chatId) {
//     throw new ApiError(400, "Chat id is required");
//   }

//   if (!message) {
//     throw new ApiError(400, "User message is required");
//   }

//   if (!role) {
//     throw new ApiError(400, "Message role is required");
//   }

//   // save user message
//   const createUserMsg = await prisma.message.create({
//     data: {
//       chatId: chatId,
//       content: message,
//       role: role,
//     },
//   });
//   // fetch all user msg
//   const fetchAllUserMessage = await prisma.message.findMany({
//     where: {
//       chatId: chatId,
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//     select: {
//       id: true,
//       chatId: true,
//       content: true,
//       role: true,
//       status: true,
//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   let contents;
// });

// export const generateMsg = AsyncHandler(async (req, res) => {
//   const { chatId, message, role } = req.body;
//   const userId = req.user?.id!;

//   if (!chatId) throw new ApiError(400, "Chat id is required");
//   if (!message) throw new ApiError(400, "User message is required");
//   if (!role) throw new ApiError(400, "Message role is required");

//   // save user message
//   const createUserMsg = await prisma.message.create({
//     data: { chatId, content: message, role },
//   });

//   // fetch chat history
//   const history = await prisma.message.findMany({
//     where: { chatId },
//     orderBy: { createdAt: "asc" },
//     select: { content: true, role: true },
//   });

//   // convert history into Gemini format
//   const contents = history.map((msg) => ({
//     role: msg.role === "USER" ? "user" : "model",
//     parts: [{ text: msg.content }],
//   }));

//   // call Gemini
//   const result = await ai.models.generateContent({
//     model: "gemini-1.5-pro",
//     contents: [
//       { role: "system", parts: [{ text: systemInstruction }] },
//       ...contents,
//     ],
//     config: {
//       tools: [{ functionDeclarations: functions }],
//     },
//   });

//   let assistantReply = null;

//   if (result.functionCalls) {
//     for (const fn of result.functionCalls) {
//       switch (fn.name) {
//         case "createMockRoute":
//           await prisma.mockRoute.create({
//             data: {
//               userId,
//               chatId,
//               method: fn.args.method || "GET",
//               path: fn.args.path,
//               response: fn.args.response,
//             },
//           });
//           assistantReply = `✅ Created mock API ${fn.args.method || "GET"} ${
//             fn.args.path
//           }`;
//           break;

//         case "listMockRoutes":
//           const routes = await prisma.mockRoute.findMany({ where: { chatId } });
//           assistantReply =
//             `📂 APIs:\n` +
//             routes.map((r) => `${r.method} ${r.path}`).join("\n");
//           break;

//         case "updateMockRoute":
//           await prisma.mockRoute.updateMany({
//             where: {
//               chatId,
//               path: fn.args.path,
//               method: fn.args.method || "GET",
//             },
//             data: { response: fn.args.response },
//           });
//           assistantReply = `✏️ Updated API ${fn.args.method || "GET"} ${
//             fn.args.path
//           }`;
//           break;

//         case "deleteMockRoute":
//           await prisma.mockRoute.deleteMany({
//             where: {
//               chatId,
//               path: fn.args.path,
//               method: fn.args.method || "GET",
//             },
//           });
//           assistantReply = `🗑️ Deleted API ${fn.args.method || "GET"} ${
//             fn.args.path
//           }`;
//           break;
//       }
//     }
//   } else {
//     assistantReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "🤖";
//   }

//   // save assistant message
//   const assistantMsg = await prisma.message.create({
//     data: {
//       chatId,
//       content: assistantReply,
//       role: "ASSISTANT",
//       status: "COMPLETED",
//     },
//   });

//   res.json({ userMsg: createUserMsg, assistantMsg });
// });
