import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { FileRequest } from "../model/FileModel";
import { encryptData, decryptData } from "../Utils/Encryption";
import {
  queryUserDetailbyUsername,
  queryUserPrivateKeybyUsername,
} from "../repository/UserRepository";
import { PDFSigner } from "../Utils/PDFSigner";
import {
  createFile,
  createFileKey,
  queryAllFile,
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
  password: string,
) => {
  if (!encryptionMethod || !supportedAlgorithms.includes(encryptionMethod)) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Encryption Method");
  }

  const user = await queryUserDetailbyUsername(username);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const userPrivateKey = await queryUserPrivateKeybyUsername(username);
  if (!userPrivateKey) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  if (!data) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid File");
  }

  let processedBuffer: Buffer = data.buffer;
  if (data.mimetype === "application/pdf") {
    if (!password) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        "Password required for PDF signing",
      );
    }

    try {
      processedBuffer = await PDFSigner.signPDF(
        data.buffer,
        userPrivateKey.privateKey,
        password,
      );
    } catch (error) {
      console.log(error);
      throw new CustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to sign PDF: ${error.message}`,
      );
    }
  }

  const fileKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const encryptedData = encryptData(
    processedBuffer,
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

export const listAllFile = async () => {
  const userFile = await queryAllFile();
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

  if (file.mimetype === "application/pdf") {
    try {
      const owner = await queryUserDetailbyUsername(username);
      if (!owner) {
        throw new CustomError(StatusCodes.BAD_REQUEST, "File owner not found");
      }

      const isValid = await PDFSigner.verifySignature(
        decryptedData,
        owner.publicKey,
      );

      if (!isValid) {
        throw new CustomError(
          StatusCodes.BAD_REQUEST,
          "PDF signature verification failed",
        );
      }
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to verify PDF signature: ${error.message}`,
      );
    }
  }

  return {
    data: decryptedData,
    filename: file.filename,
    mimetype: file.mimetype,
  };
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
