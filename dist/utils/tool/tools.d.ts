import { type FunctionDeclaration } from "@google/genai";
/**
 * Gemini Tool Declarations
 * (no chatId or userId here, they’ll be injected by backend)
 */
export declare const createMockRouteFn: FunctionDeclaration;
export declare const updateMockRouteFn: FunctionDeclaration;
export declare const listMockRoutesFn: FunctionDeclaration;
/**
 * Tool Implementations
 */
export declare const toolFunctions: {
    createMockRoute({ userId, chatId, method, path, response }: any): Promise<{
        message: string;
        mock: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            method: string;
            path: string;
            response: import("@prisma/client/runtime/library").JsonValue;
            userId: string;
            chatId: string;
        };
    }>;
    updateMockRoute({ userId, chatId, method, path, response }: any): Promise<{
        message: string;
        updatedCount: number;
    }>;
    listMockRoutes({ userId, chatId }: any): Promise<{
        mocks: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            method: string;
            path: string;
            response: import("@prisma/client/runtime/library").JsonValue;
            userId: string;
            chatId: string;
        }[];
    }>;
};
//# sourceMappingURL=tools.d.ts.map