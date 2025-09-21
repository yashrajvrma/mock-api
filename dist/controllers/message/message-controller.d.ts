import { type FunctionDeclaration } from "@google/genai";
/**
 * Gemini Tool Declarations
 * (no chatId or userId here, they’ll be injected by backend)
 */
export declare const createMockRouteFn: FunctionDeclaration;
export declare const updateMockRouteFn: FunctionDeclaration;
export declare const listMockRoutesFn: FunctionDeclaration;
/**
 * Agent Message Generator
 */
export declare const generateMsg: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=message-controller.d.ts.map