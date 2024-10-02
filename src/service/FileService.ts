import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { FileRequest } from "../model/FileModel";
import { encryptData, decryptData } from "../Utils/Encryption";
import { queryUserDetailbyUsername } from "../repository/UserRepository";
import {
  createFile,
  queryAllFilebyUserID,
  queryFileDetailbyID,
  removeFile,
} from "../repository/FileRepository";

export const uploadFile = async (data: FileRequest, username: string) => {
  try {
    const user = await queryUserDetailbyUsername(username);
    if (!user) {
      throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
    }

    if (!data || !data.buffer) {
      throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File");
    }

    const fileName = `${Date.now()}-${data.originalname}`;
    const encryptedData = encryptData(data.buffer, user.password);
    const userFile = await createFile(
      fileName,
      data.mimetype,
      encryptedData,
      user.id,
    );

    return userFile;
  } catch (error) {
    console.error("Error in uploadFile:", error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};

export const listFile = async (username: string) => {
  try {
    const user = await queryUserDetailbyUsername(username);
    if (!user) {
      throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
    }

    const userFiles = await queryAllFilebyUserID(user.id);
    return userFiles;
  } catch (error) {
    console.error("Error in listFile:", error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to list files");
  }
};

export const retrieveFile = async (fileId: string, username: string) => {
  try {
    const user = await queryUserDetailbyUsername(username);
    if (!user) {
      throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
    }

    const userFile = await queryFileDetailbyID(fileId, user.id);
    if (!userFile) {
      throw new CustomError(StatusCodes.NOT_FOUND, "File not found");
    }

    const buffer = await userFile.arrayBuffer();
    const decryptedData = decryptData(Buffer.from(buffer), user.password);

    return decryptedData;
  } catch (error) {
    console.error("Error in retrieveFile:", error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve file");
  }
};

export const deleteFile = async (fileId: string, username: string) => {
  try {
    const user = await queryUserDetailbyUsername(username);
    if (!user) {
      throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
    }

    const result = await removeFile(fileId, user.id);
    return result;
  } catch (error) {
    console.error("Error in deleteFile:", error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete file");
  }
};