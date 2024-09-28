import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { FileRequest } from "../model/FileModel";
import { encryptData, decryptData } from "../Utils/Encryption";
import { queryUserDetailbyUsername } from "../repository/UserRepository";
import {
  createFile,
  queryFileDetailbyID,
  removeFile,
} from "../repository/FileRepository";

export const uploadFile = async (data: FileRequest, username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  if (!data) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File");
  }

  const fileName = Date.now() + "-" + data.originalname;
  const encryptedData = encryptData(data.buffer, user.password);
  const userFile = await createFile(
    fileName,
    data.mimetype,
    encryptedData,
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

  const buffer = Buffer.from(
    await (
      userFile.data as { arrayBuffer(): Promise<ArrayBuffer> }
    ).arrayBuffer(),
  );
  const decryptedData = decryptData(buffer, user.password);

  return decryptedData;
};

export const deleteFile = async (fileId: string, username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const userFile = await removeFile(fileId, user.id);
  if (!userFile) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid ID");
  }

  return userFile;
};
