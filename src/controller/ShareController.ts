import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { responseData, responseError } from "../Utils/API-Response";
import { UserToken } from "../middleware/AuthMiddleware";
import * as ShareService from "../service/ShareService";

export const requestAccess = async (req: Request, res: Response) => {
  try {
    const requesterId = (req as UserToken).user.username;
    const fileId = parseInt(req.params.file_id);
    const shareRequest = await ShareService.requestFileAccess(requesterId, fileId);

    responseData(res, StatusCodes.OK, "Access request sent successfully", shareRequest);
  } catch (err) {
    responseError(res, err);
  }
};

export const listPendingRequests = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as UserToken).user.id;
    const pendingRequests = await ShareService.listPendingRequests(ownerId);

    responseData(
      res,
      StatusCodes.OK,
      "Pending share requests retrieved successfully",
      pendingRequests
    );
  } catch (err) {
    responseError(res, err);
  }
};

export const approveAccess = async (req: Request, res: Response) => {
  try {
    const shareId = parseInt(req.params.share_id);
    const shareApproval = await ShareService.approveFileAccess(shareId);

    responseData(res, StatusCodes.OK, "Access approved successfully", shareApproval);
  } catch (err) {
    responseError(res, err);
  }
};

export const listSharedFiles = async (req: Request, res: Response) => {
    try {
      const userId = (req as UserToken).user.id;
      const sharedFiles = await ShareService.listSharedFiles(userId);
  
      responseData(
        res,
        StatusCodes.OK,
        "Shared files retrieved successfully",
        sharedFiles
      );
    } catch (err) {
      responseError(res, err);
    }
};
  
export const retrieveSharedFile = async (req: Request, res: Response) => {
    try {
      const username = (req as UserToken).user.username;
      const fileId = parseInt(req.params.file_id);
      const password = req.body.password;
      const file = await ShareService.retrieveSharedFile(fileId, username, password);
  
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.filename}"`
      );
      res.setHeader("Content-Type", file.mimetype);
      res.send(file.data);
    } catch (err) {
      responseError(res, err);
    }
};