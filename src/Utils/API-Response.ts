import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CustomError, getCustomErrorObject } from "./ErrorHandling";

export const responseOK = (
  res: Response,
  code: number = StatusCodes.OK,
  message: string | null = null,
) => {
  return res.status(code).json({
    success: true,
    ...(message && { message }),
  });
};

export const responseData = (
  res: Response,
  code: number = StatusCodes.OK,
  message: string | null = null,
  data: Array<object> | object | undefined,
  rest: object = {},
) => {
  return res.status(code).json({
    ...(message && { message }),
    success: true,
    data,
    ...(rest && rest),
  });
};

export const responseError = (
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  rest: object = {},
) => {
  const errorObject: CustomError = getCustomErrorObject(error);

  return res.status(errorObject.code).json({
    ...(errorObject.message && { message: errorObject.message }),
    success: false,
    ...(errorObject.errors && { errors: errorObject.errors }),
    ...(rest && rest),
  });
};
