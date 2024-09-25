import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { LoginRequest } from "../model/AuthModel";
import {
  queryUserByEmail,
  queryUserByUsername,
} from "../repository/AuthRepository";
import { generateAccessToken } from "../Utils/JWT-Token";
import bcrypt from "bcrypt";

export const loginUser = async (data: LoginRequest) => {
  const user = await queryUserByEmail(data.email);
  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Credential");
  }

  const isPasswordMatch = bcrypt.compareSync(data.password, user.password);
  if (!isPasswordMatch) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Credential");
  }

  const payload = {
    username: user.username,
  };

  const accessToken = generateAccessToken(payload);

  return { accessToken };
};

export const userProfile = async (userUsername: string) => {
  const user = await queryUserByUsername(userUsername);

  if (!user) {
    throw new CustomError(StatusCodes.NOT_FOUND, "Invalid User");
  }

  delete user.password;

  return user;
};
