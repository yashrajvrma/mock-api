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
export declare const verifyJWT: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export {};
//# sourceMappingURL=auth-middleware.d.ts.map