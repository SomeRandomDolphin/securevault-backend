import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { responseData, responseError } from "../Utils/API-Response";
import { UserToken } from "../middleware/AuthMiddleware";
import * as FileService from "../service/FileService";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const username = (req as UserToken).user.username;
    const value = req.file;
    const userFile = await FileService.uploadFile(value, username);

    responseData(res, StatusCodes.OK, "File Uploaded Successfully", userFile);
  } catch (err) {
    responseError(res, err);
  }
};

export const retrieveFile = async (req: Request, res: Response) => {
  try {
    const username = (req as UserToken).user.username;
    const fileId = req.params.file_id;
    const userFile = await FileService.retrieveFile(fileId, username);

    res.setHeader("Content-Disposition", `attachment; filename="${fileId}"`);
    res.send(userFile);
  } catch (err) {
    responseError(res, err);
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const username = (req as UserToken).user.username;
    const fileId = req.params.file_id;
    const userFile = await FileService.deleteFile(fileId, username);

    responseData(res, StatusCodes.OK, "File Deleted Successfully", userFile);
  } catch (err) {
    responseError(res, err);
  }
};