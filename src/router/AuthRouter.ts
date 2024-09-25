import { Router } from "express";
import { loginUser, getUserProfile } from "../controller/AuthController";
import { userAuthMiddleware } from "../middleware/AuthMiddleware";

const authRouter = Router();

authRouter.post("/login", loginUser);
authRouter.get("/me", userAuthMiddleware, getUserProfile);

export default authRouter;
