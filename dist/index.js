import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
const port = process.env.PORT || 8000;
app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Test ais working",
    });
});
app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});
//# sourceMappingURL=index.js.map