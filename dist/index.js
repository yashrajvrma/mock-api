import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
const port = process.env.PORT || 8080;
const app = express();
app.use(cookieParser());
app.use(express.json({
    limit: "16kb",
}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.get("/", (req, res) => {
    return res.json({
        message: "Test api is working",
    });
});
// import routes
import authRouter from "./routes/auth-route.js";
app.use("/v1/api/auth", authRouter);
// error middleware
import errorHandler from "./middlewares/error-middleware.js";
app.use(errorHandler);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map