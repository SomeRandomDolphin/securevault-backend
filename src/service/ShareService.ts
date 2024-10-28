import crypto from "crypto";
import { CustomError } from "../Utils/ErrorHandling";
import { StatusCodes } from "http-status-codes";
import { decryptData } from "../Utils/Encryption";
import {
  queryUserDetailbyID,
  queryUserDetailbyUsername,
  queryUserPrivateKeybyUsername,
} from "../repository/UserRepository";
import { decryptPrivateKey } from "../Utils/KeyManagement";
import {
  queryFileDetailbyID,
  queryFileKeybyFileID,
} from "../repository/FileRepository";
import {
  createShareRequest,
  findPendingShareRequest,
  getShareRequestWithFile,
  updateShareRequest,
  getApprovedShares,
  getShareAccessWithFile,
  downloadSharedFile,
  getPendingShareRequests,
} from "../repository/ShareRepository";

export const requestFileAccess = async (
  requesterId: string,
  fileId: number,
) => {
  const requester = await queryUserDetailbyUsername(requesterId);
  if (!requester) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const file = await queryFileDetailbyID(fileId);
  if (!file) {
    throw new CustomError(StatusCodes.NOT_FOUND, "File not found");
  }

  if (file.userId === requester.id) {
    throw new CustomError(
      StatusCodes.BAD_REQUEST,
      "Cannot request access to your own file",
    );
  }

  const existingRequest = await findPendingShareRequest(fileId, requester.id);
  if (existingRequest) {
    throw new CustomError(
      StatusCodes.CONFLICT,
      "Access request already pending",
    );
  }

  return await createShareRequest(file.userId, requester.id, fileId);
};

export const listPendingRequests = async (ownerId: number) => {
  try {
    const pendingRequests = await getPendingShareRequests(ownerId);

    return pendingRequests.map((request) => ({
      id: request.id,
      requester: {
        username: request.sharedAccessFromRequester.username,
        email: request.sharedAccessFromRequester.email,
      },
      file: {
        id: request.fileId,
        filename: request.sharedAccessFromFile.filename,
        mimetype: request.sharedAccessFromFile.mimetype,
      },
      requestedAt: request.createdAt,
      expiresAt: request.expiresAt,
    }));
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to list pending requests: ${error.message}`,
    );
  }
};

export const approveFileAccess = async (shareId: number) => {
  const shareRequest = await getShareRequestWithFile(shareId);
  if (!shareRequest || shareRequest.status !== "PENDING") {
    throw new CustomError(StatusCodes.NOT_FOUND, "Invalid share request");
  }

  const requester = await queryUserDetailbyID(shareRequest.requesterId);
  if (!requester) {
    throw new CustomError(
      StatusCodes.BAD_REQUEST,
      "Requester has no public key",
    );
  }

  const fileKey = await queryFileKeybyFileID(shareRequest.fileId);
  if (!fileKey) {
    throw new CustomError(StatusCodes.NOT_FOUND, "File key not found");
  }

  try {
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

    const decryptedFileKey = Buffer.concat([
      decipher.update(Buffer.from(fileKey.encryptedKey, "hex")),
      decipher.final(),
    ]);

    const encryptedKeyForRequester = crypto.publicEncrypt(
      {
        key: requester.publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      decryptedFileKey,
    );

    return await updateShareRequest(
      shareId,
      encryptedKeyForRequester.toString("base64"),
      requester.publicKey,
    );
  } catch (error) {
    console.error("Share key encryption error:", error);
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to encrypt sharing key: ${error.message}`,
    );
  }
};

export const listSharedFiles = async (userId: number) => {
  try {
    const sharedFiles = await getApprovedShares(userId);

    const filesWithSize = await Promise.all(
      sharedFiles.map(async (share) => {
        const file = await queryFileDetailbyID(share.fileId);
        const user = await queryUserDetailbyID(file.userId);

        return {
          id: file.id,
          filename: file.filename,
          mimetype: file.mimetype,
          owner: user.username,
          sharedAt: share.createdAt,
          expiresAt: share.expiresAt,
        };
      }),
    );

    return filesWithSize;
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to list shared files: ${error.message}`,
    );
  }
};

export const retrieveSharedFile = async (
  fileId: number,
  username: string,
  userPassword: string,
) => {
  try {
    const requester = await queryUserDetailbyUsername(username);
    if (!requester) {
      throw new CustomError(StatusCodes.NOT_FOUND, "Requester not found");
    }

    const shareAccess = await getShareAccessWithFile(fileId, requester.id);
    if (!shareAccess) {
      throw new CustomError(
        StatusCodes.FORBIDDEN,
        "No valid share access found",
      );
    }

    const file = await queryFileDetailbyID(fileId);
    const userPrivateKey = await queryUserPrivateKeybyUsername(username);
    const privateKey = decryptPrivateKey(
      userPrivateKey.privateKey,
      userPassword,
    );

    try {
      const encryptedKey = Buffer.from(shareAccess.encryptedKey, "base64");
      const fileKeyBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        encryptedKey,
      );

      const encryptedData = await downloadSharedFile(file.path);
      const encryptedBuffer = Buffer.from(await encryptedData.arrayBuffer());

      const decryptedData = decryptData(
        encryptedBuffer,
        fileKeyBuffer.toString("hex"),
        file.encryptionMethod,
      );

      return {
        data: decryptedData,
        filename: file.filename,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error("Decryption error:", error);
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Failed to decrypt file: ${error.message}`,
      );
    }
  } catch (error) {
    console.error("Retrieve File Error:", error);
    throw error;
  }
};
