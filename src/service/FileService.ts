import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { FileRequest } from "../model/FileModel";
import { encryptData, decryptData } from "../Utils/Encryption";
import { queryUserDetailbyUsername } from "../repository/UserRepository";
import {
  createFile,
  createFileKey,
  queryAllFilebyUserID,
  queryFilebyID,
  queryFileDetailbyID,
  queryFileKeybyFileID,
  removeFile,
} from "../repository/FileRepository";
import { supportedAlgorithms } from "../Utils/Encryption";
import type { EncryptionMethod } from "../Utils/Encryption";
import crypto from "crypto";

export const uploadFile = async (
  data: FileRequest,
  username: string,
  encryptionMethod: EncryptionMethod,
) => {
  if (!encryptionMethod || !supportedAlgorithms.includes(encryptionMethod)) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Encryption Method");
  }

  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  if (!data) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File");
  }

  const fileKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const encryptedData = encryptData(
    data.buffer,
    fileKey.toString("hex"),
    encryptionMethod,
  );
  const fileName = Date.now() + "-" + data.originalname;
  const userFile = await createFile(
    fileName,
    data.mimetype,
    encryptedData,
    user.id,
    encryptionMethod,
  );

  if (!userFile) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Data");
  }

  const masterKey = process.env.MASTER_KEY;
  if (!masterKey) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Master Key Not Configured",
    );
  }

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(masterKey, "hex"),
    iv,
  );
  const encryptedKey = Buffer.concat([
    cipher.update(fileKey),
    cipher.final(),
  ]).toString("hex");
  await createFileKey(userFile.id, encryptedKey, iv.toString("hex"));

  return userFile;
};

export const listFile = async (username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const userFile = await queryAllFilebyUserID(user.id);
  if (!userFile) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  return userFile;
};

export const retrieveFile = async (fileId: string, username: string) => {
  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const blob = await queryFilebyID(fileId, user.id);
  if (!blob) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid ID");
  }

  const file = await queryFileDetailbyID(parseInt(fileId));
  if (!file) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File");
  }

  const fileKey = await queryFileKeybyFileID(parseInt(fileId));
  if (!fileKey) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File Key");
  }

  const masterKey = process.env.MASTER_KEY;
  if (!masterKey) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Master key not configured",
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(masterKey, "hex"),
    Buffer.from(fileKey.iv, "hex"),
  );

  const decryptedKey = Buffer.concat([
    decipher.update(Buffer.from(fileKey.encryptedKey, "hex")),
    decipher.final(),
  ]).toString("hex");

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const decryptedData = decryptData(
    buffer,
    decryptedKey,
    file.encryptionMethod,
  );

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
