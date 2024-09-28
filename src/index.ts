import express, { Express, Request, Response } from "express";
import cors from "cors";
import env from "./config/LoacEnv";
import favicon from "serve-favicon";
import path from "path";

import authRouter from "./router/AuthRouter";
import userRouter from "./router/UserRouter";
import fileRouter from "./router/FileRouter";

const app: Express = express();
const PORT = env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/files", fileRouter);

app.get("/api", (_: Request, res: Response) => {
  res.send("Secure Vault API!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
