import { Request, Response } from "express";
import { userSchema } from "../Utils/Validation";
import Joi from "joi";
import { UserRequest } from "../model/UserModel";
import { responseData, responseError } from "../Utils/API-Response";
import { StatusCodes } from "http-status-codes";
import * as UserService from "../service/UserService";
import { UserToken } from "../middleware/AuthMiddleware";

export const registerUser = async (req: Request, res: Response) => {
  const {
    error,
    value,
  }: {
    error: Joi.ValidationError;
    value: UserRequest;
  } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    responseError(res, error);
    return;
  }

  try {
    const user = await UserService.registerUser(value);
    responseData(res, StatusCodes.OK, "User Registration Successful", user);
  } catch (err) {
    responseError(res, err);
  }
};

export const retrieveUser = async (req: Request, res: Response) => {
  try {
    const value = Number(req.params.user_id);
    const url = await UserService.retrieveUser(value);
    responseData(res, StatusCodes.OK, "User Retrieved", url);
  } catch (err) {
    responseError(res, err);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const {
    error,
    value,
  }: {
    error: Joi.ValidationError;
    value: UserRequest;
  } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    responseError(res, error);
    return;
  }

  try {
    const { username } = (req as UserToken).user;
    const updatedUser = await UserService.updateUser(username, value);
    responseData(res, StatusCodes.OK, "User Updated Successfully", updatedUser);
  } catch (err) {
    responseError(res, err);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { username } = (req as UserToken).user;
    const url = await UserService.deleteUser(username);
    responseData(res, StatusCodes.OK, "User Deleted Successfully", url);
  } catch (err) {
    responseError(res, err);
  }
};
