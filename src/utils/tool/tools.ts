import {
  GoogleGenAI,
  Type,
  type FunctionCall,
  type FunctionDeclaration,
} from "@google/genai";
import prisma from "../../config/db.js";

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
export const toolFunctions = {
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
