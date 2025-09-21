interface TokenDataProps {
    id: string;
    email: string;
}
export declare const generateAccessToken: (data: TokenDataProps) => Promise<never>;
export declare const generateRefreshToken: ({ id }: {
    id: string;
}) => Promise<never>;
export {};
//# sourceMappingURL=generate-token.d.ts.map