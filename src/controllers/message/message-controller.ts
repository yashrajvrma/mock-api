import prisma from "../../config/db.js";
import ApiError from "../../utils/api-error.js";
import AsyncHandler from "../../utils/async-handler.js";
import {
  GoogleGenAI,
  Type,
  type FunctionCall,
  type FunctionDeclaration,
} from "@google/genai";
import { systemInstruction } from "../../utils/constants/prompt.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Gemini Tool Declarations
 * (no chatId or userId here, they’ll be injected by backend)
 */
export const createMockRouteFn: FunctionDeclaration = {
  name: "createMockRoute",
  description: "Create a new mock API endpoint for the user",
  parameters: {
    type: Type.OBJECT,
    properties: {
      method: {
        type: Type.STRING,
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      },
      path: { type: Type.STRING },
      response: { type: Type.OBJECT },
    },
    required: ["path", "response"],
  },
};

export const updateMockRouteFn: FunctionDeclaration = {
  name: "updateMockRoute",
  description: "Update an existing mock API endpoint for the user",
  parameters: {
    type: Type.OBJECT,
    properties: {
      method: { type: Type.STRING },
      path: { type: Type.STRING },
      response: { type: Type.OBJECT },
    },
    required: ["path", "response"],
  },
};

export const listMockRoutesFn: FunctionDeclaration = {
  name: "listMockRoutes",
  description: "List all mock APIs in this chat",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

/**
 * Tool Implementations
 */
const toolFunctions = {
  // create
  async createMockRoute({ userId, chatId, method, path, response }: any) {
    const mock = await prisma.mockRoute.create({
      data: { userId, chatId, method, path, response },
    });
    return { message: "✅ Mock route created", mock };
  },

  // update
  async updateMockRoute({ userId, chatId, method, path, response }: any) {
    const mock = await prisma.mockRoute.updateMany({
      where: { userId, chatId, path, method },
      data: { response },
    });
    return { message: "♻️ Mock route updated", updatedCount: mock.count };
  },

  // list
  async listMockRoutes({ userId, chatId }: any) {
    const mocks = await prisma.mockRoute.findMany({
      where: { userId, chatId },
    });
    return { mocks };
  },
};

/**
 * Agent Message Generator
 */
export const generateMsg = AsyncHandler(async (req, res) => {
  const { chatId, message, role } = req.body;
  const userId = req.user!.id;

  if (!chatId || !message || !role) {
    throw new ApiError(400, "chatId, message and role are required");
  }

  // 1. Save user message
  const createUserMsg = await prisma.message.create({
    data: { chatId, content: message, role },
  });

  // 2. Prepare conversation history
  const history = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    select: { content: true, role: true },
  });

  let contents = [
    { role: "model", parts: [{ text: systemInstruction }] },
    ...history.map((m) => ({
      role: m.role === "USER" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  let assistantReply = "";

  // 3. Agent loop
  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        tools: [
          { functionDeclarations: [createMockRouteFn] },
          { functionDeclarations: [updateMockRouteFn] },
          { functionDeclarations: [listMockRoutesFn] },
        ],
        systemInstruction: systemInstruction,
      },
    });

    console.log("response is", JSON.stringify(response));

    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log("processing function call");
      const fn = response.functionCalls[0] as FunctionCall;
      const { name, args } = fn;

      if (!name || !(name in toolFunctions)) {
        throw new Error(`Unknown function: ${name}`);
      }

      // 🔹 Inject userId + chatId automatically
      const finalArgs = { ...args, userId, chatId };

      console.log(`Function calling ${name} with args`, finalArgs);

      // @ts-ignore
      const toolResponse = await toolFunctions[name](finalArgs);

      // Feed back to model
      // @ts-ignore
      contents.push({ role: "model", parts: [{ functionCall: fn }] });
      contents.push({
        role: "user",
        // @ts-ignore
        parts: [{ functionResponse: { name, response: toolResponse } }],
      });
    } else {
      assistantReply = response.text || "🤖";
      break;
    }
  }

  // 4. Save assistant reply
  const assistantMsg = await prisma.message.create({
    data: { chatId, content: assistantReply, role: "ASSISTANT" },
  });

  res.json({ userMsg: createUserMsg, assistantMsg });
});
