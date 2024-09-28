import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { FileRequest } from "../model/FileModel";
import { createFile, queryFileDetailbyID } from "../repository/FileRepository";
import { queryUserDetailbyUsername } from "../repository/UserRepository";

export const uploadFile = async (data: FileRequest, username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  if (!data) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File");
  }

  const fileName = Date.now() + "-" + data.originalname;
  const userFile = await createFile(
    fileName,
    data.mimetype,
    data.buffer,
    user.id,
  );

  if (!userFile) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Data");
  }

  return userFile;
};

export const retrieveFile = async (fileId: string, username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const userFile = await queryFileDetailbyID(fileId, user.id);
  if (!userFile) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid ID");
  }

  return userFile;
};

export const deleteFile = async (fileId: string, username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const userFile = await queryFileDetailbyID(fileId, user.id);
  if (!userFile) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid ID");
  }

  return userFile;
};
