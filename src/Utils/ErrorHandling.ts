import { Prisma } from "@prisma/client";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import Joi from "joi";

export class CustomError extends Error {
  code: number = StatusCodes.INTERNAL_SERVER_ERROR;
  errors: object;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(code: number, message: any, error: object | null = null) {
    super(message);
    this.code = code;
    this.errors = error;
  }
}

export const PrismaErrorTypes = [
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientKnownRequestError,
];

export const getCustomErrorObject = (err: unknown) => {
  if (err instanceof CustomError) {
    return err;
  }

  const error = new CustomError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    ReasonPhrases.INTERNAL_SERVER_ERROR,
  );

  // if error comes from Joi validation schema
  if (err instanceof Joi.ValidationError) {
    error.code = StatusCodes.BAD_REQUEST;
    error.errors = ParseJoiErrorObject(err);
    error.message = ReasonPhrases.BAD_REQUEST;
  }

  PrismaErrorTypes.forEach((e) => {
    if (err instanceof e) {
      error.code = StatusCodes.BAD_REQUEST;
      error.name = err.name;
      error.message = err.message;
    }
  });

  return error;
};

export const ParseJoiErrorObject = (errors: Joi.ValidationError) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err: { [path: string]: any } = {};

  errors.details.forEach((error) => {
    err[error.path[0] as string] = error.message;
  });

  return err;
};
