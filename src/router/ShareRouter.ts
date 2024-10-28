import { Router } from "express";
import {
  requestAccess,
  listPendingRequests,
  approveAccess,
  listSharedFiles,
  retrieveSharedFile,
} from "../controller/ShareController";
import { userAuthMiddleware } from "../middleware/AuthMiddleware";

const shareRouter = Router();

shareRouter.post("/request/:file_id", userAuthMiddleware, requestAccess);
shareRouter.get("/pending", userAuthMiddleware, listPendingRequests);
shareRouter.post("/accept/:share_id", userAuthMiddleware, approveAccess);
shareRouter.get("/files", userAuthMiddleware, listSharedFiles);
shareRouter.post("/files/:file_id", userAuthMiddleware, retrieveSharedFile);

export default shareRouter;
