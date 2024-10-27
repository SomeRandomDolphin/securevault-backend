import env from "../config/LoacEnv";
import { createClient } from "@supabase/supabase-js";
import prisma from "../config/connectDb";
import { CustomError } from "../Utils/ErrorHandling";
import { StatusCodes } from "http-status-codes";
import { Encryption } from "@prisma/client";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export const createFile = async (
  originalname: string,
  mimetype: string,
  buffer: Buffer,
  userId: number,
  encryptionMethod: Encryption,
) => {
  try {
    const uploadPath = `${userId}/${originalname}`;
    const storageResponse = await supabase.storage
      .from("user_data")
      .upload(uploadPath, buffer, { contentType: mimetype });

    if (storageResponse.error) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Storage error: ${storageResponse.error.message}`,
      );
    }

    const file = await prisma.file.create({
      data: {
        filename: originalname,
        mimetype: mimetype,
        path: uploadPath,
        encryptionMethod: encryptionMethod,
        userId: userId,
      },
    });

    return file;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to create file: ${error.message}`,
    );
  }
};

export const createFileKey = async (
  fileId: number,
  encryptedKey: string,
  iv: string,
) => {
  try {
    const fileKey = await prisma.fileKey.create({
      data: {
        encryptedKey: encryptedKey,
        iv: iv,
        fileId: fileId,
      },
    });
    return fileKey;
  } catch (error) {
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to store file key: ${error.message}`,
    );
  }
};

export const queryAllFilebyUserID = async (userId: number) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        userId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        filename: true,
        mimetype: true,
        path: true,
        encryptionMethod: true,
        createdAt: true,
      },
    });

    const storageResponse = await supabase.storage
      .from("user_data")
      .list(String(userId), {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (storageResponse.error) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Storage error: ${storageResponse.error.message}`,
      );
    }

    const combinedData = files.map((file) => {
      const storageFile = storageResponse.data.find(
        (sf) => sf.name === file.filename,
      );
      return {
        ...file,
        size: storageFile?.metadata?.size || 0,
        lastModified: storageFile?.metadata?.lastModified || file.createdAt,
      };
    });

    return combinedData;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to query files: ${error.message}`,
    );
  }
};

export const queryFilebyID = async (fileId: string, userId: number) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: parseInt(fileId),
        userId: userId,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new CustomError(StatusCodes.NOT_FOUND, "File not found");
    }

    const storageResponse = await supabase.storage
      .from("user_data")
      .download(file.path);

    if (storageResponse.error) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Storage error: ${storageResponse.error.message}`,
      );
    }

    return storageResponse.data;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to retrieve file: ${error.message}`,
    );
  }
};

export const queryFileDetailbyID = async (fileId: number) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      throw new CustomError(StatusCodes.NOT_FOUND, "File key not found");
    }

    return file;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to retrieve file key: ${error.message}`,
    );
  }
};

export const queryFileKeybyFileID = async (fileId: number) => {
  try {
    const fileKey = await prisma.fileKey.findUnique({
      where: {
        fileId: fileId,
      },
    });

    if (!fileKey) {
      throw new CustomError(StatusCodes.NOT_FOUND, "File key not found");
    }

    return fileKey;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to retrieve file key: ${error.message}`,
    );
  }
};

export const removeFile = async (fileId: string, userId: number) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: parseInt(fileId),
        userId: userId,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new CustomError(StatusCodes.NOT_FOUND, "File not found");
    }

    const storageResponse = await supabase.storage
      .from("user_data")
      .remove([file.path]);

    if (storageResponse.error) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        `Storage error: ${storageResponse.error.message}`,
      );
    }

    await prisma.$transaction([
      prisma.fileKey.update({
        where: { fileId: file.id },
        data: { deletedAt: new Date() },
      }),
      prisma.file.update({
        where: { id: file.id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return file;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to delete file: ${error.message}`,
    );
  }
};
