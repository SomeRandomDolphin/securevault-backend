import { StatusCodes } from "http-status-codes";
import { CustomError } from "../Utils/ErrorHandling";
import { UserRequest } from "../model/UserModel";
import {
  createUser,
  queryUserDetailbyID,
  queryUserDetailbyUsername,
  queryUserDetailbyEmail,
  editUser,
  removeUser,
} from "../repository/UserRepository";

export const registerUser = async (data: UserRequest) => {
  const isRegistedUsername = await queryUserDetailbyUsername(data.username);
  if (isRegistedUsername) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid User");
  }

  const isRegisteredEmail = await queryUserDetailbyEmail(data.email);
  if (isRegisteredEmail) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Email");
  }

  const user = await createUser(data.username, data.email, data.password);

  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Data");
  }

  return user;
};

export const retrieveUser = async (data: number) => {
  const user = await queryUserDetailbyID(data);

  if (!user) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid ID");
  }

  return user;
};

export const updateUser = async (userUsername: string, data: UserRequest) => {
  const user = await queryUserDetailbyUsername(userUsername);

  if (!user) {
    throw new CustomError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  const updatedUser = await editUser(user.id, data);

  if (!updatedUser) {
    throw new CustomError(StatusCodes.BAD_REQUEST, "Invalid Data");
  }

  return updatedUser;
};

export const deleteUser = async (userUsername: string) => {
  const user = await queryUserDetailbyUsername(userUsername);

  if (!user) {
    throw new CustomError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  const updatedUser = await removeUser(user.id);

  if (!updatedUser) {
    throw new CustomError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  return updatedUser;
};
