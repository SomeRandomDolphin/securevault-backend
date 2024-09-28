import { Router } from "express";
import multer from "multer";
import {
  uploadFile,
  retrieveFile,
  deleteFile,
  listFile,
} from "../controller/FileController";
import { userAuthMiddleware } from "../middleware/AuthMiddleware";

const fileRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

fileRouter.post(
  "/upload",
  userAuthMiddleware,
  upload.single("file"),
  uploadFile,
);
fileRouter.get("/me", userAuthMiddleware, listFile);
fileRouter.get("/:file_id", userAuthMiddleware, retrieveFile);
fileRouter.delete("/:file_id", userAuthMiddleware, deleteFile);

export default fileRouter;
