import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { responseError } from "../Utils/API-Response";
import { CustomError } from "../Utils/ErrorHandling";
import jwt from "jsonwebtoken";
import env from "../config/LoacEnv";

export interface UserToken extends Request {
  user: TokenData;
}

interface TokenData {
  id: number;
  username: string;
  email: string;
  password: string;
}

export const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    responseError(
      res,
      new CustomError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED"),
    );
    return;
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, env.SECRET_ACCESS_TOKEN, (err, tokenData) => {
    if (err) {
      responseError(
        res,
        new CustomError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED"),
      );
      return;
    }

    (req as UserToken).user = tokenData as TokenData;
    next();
  });
};
