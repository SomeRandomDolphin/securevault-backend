import prisma from "../config/connectDb";
import { createClient } from "@supabase/supabase-js";
import { CustomError } from "../Utils/ErrorHandling";
import { StatusCodes } from "http-status-codes";
import { ShareStatus } from "@prisma/client";
import env from "../config/LoacEnv";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export const createShareRequest = async (
  ownerId: number,
  requesterId: number,
  fileId: number,
) => {
  try {
    return await prisma.sharedAccess.create({
      data: {
        ownerId,
        requesterId,
        fileId,
        status: ShareStatus.PENDING,
        encryptedKey: "",
        publicKeyUsed: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to create share request: ${error.message}`,
    );
  }
};

export const getPendingShareRequests = async (ownerId: number) => {
  try {
    return await prisma.sharedAccess.findMany({
      where: {
        ownerId,
        status: ShareStatus.PENDING,
      },
      include: {
        sharedAccessFromRequester: {
          select: {
            username: true,
            email: true,
          },
        },
        sharedAccessFromFile: {
          select: {
            filename: true,
            mimetype: true,
          },
        },
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get pending share requests: ${error.message}`,
    );
  }
};

export const findPendingShareRequest = async (
  fileId: number,
  requesterId: number,
) => {
  try {
    return await prisma.sharedAccess.findFirst({
      where: {
        fileId,
        requesterId,
        status: ShareStatus.PENDING,
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to find pending share request: ${error.message}`,
    );
  }
};

export const getShareRequestWithFile = async (shareId: number) => {
  try {
    return await prisma.sharedAccess.findUnique({
      where: { id: shareId },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get share request: ${error.message}`,
    );
  }
};

export const approveShareRequest = async (
  shareId: number,
  encryptedKey: string,
  publicKeyUsed: string,
) => {
  try {
    return await prisma.sharedAccess.update({
      where: { id: shareId },
      data: {
        status: ShareStatus.APPROVED,
        encryptedKey,
        publicKeyUsed,
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to update share request: ${error.message}`,
    );
  }
};

export const rejectShareRequest = async (shareId: number) => {
  try {
    return await prisma.sharedAccess.update({
      where: { id: shareId },
      data: {
        status: ShareStatus.REJECTED,
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to update share request: ${error.message}`,
    );
  }
};

export const getApprovedShares = async (userId: number) => {
  try {
    return await prisma.sharedAccess.findMany({
      where: {
        requesterId: userId,
        status: ShareStatus.APPROVED,
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get approved shares: ${error.message}`,
    );
  }
};

export const getFileStorageDetails = async (
  username: string,
  filename: string,
) => {
  try {
    const storageResponse = await supabase.storage
      .from("user_data")
      .list(String(username), {
        search: filename,
      });

    if (storageResponse.error) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Storage error: ${storageResponse.error.message}`,
      );
    }

    return storageResponse.data?.[0];
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get file storage details: ${error.message}`,
    );
  }
};

export const getShareAccessWithFile = async (
  fileId: number,
  requesterId: number,
) => {
  try {
    return await prisma.sharedAccess.findFirst({
      where: {
        fileId,
        requesterId,
        status: ShareStatus.APPROVED,
      },
    });
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get share access: ${error.message}`,
    );
  }
};

export const downloadSharedFile = async (filePath: string) => {
  try {
    const storageResponse = await supabase.storage
      .from("user_data")
      .download(filePath);

    if (storageResponse.error) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Storage error: ${storageResponse.error.message}`,
      );
    }

    return storageResponse.data;
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to download shared file: ${error.message}`,
    );
  }
};
