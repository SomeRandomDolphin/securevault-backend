import { Router } from "express";
import {
  registerUser,
  retrieveUser,
  updateUser,
  deleteUser,
} from "../controller/UserController";
import { userAuthMiddleware } from "../middleware/AuthMiddleware";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.get("/:user_id", retrieveUser);
userRouter.put("/update", userAuthMiddleware, updateUser);
userRouter.delete("/delete", userAuthMiddleware, deleteUser);

export default userRouter;
