import db from "../config/connectDb";
import bcrypt from "bcrypt";
import env from "../config/LoacEnv";
import { UserRequest } from "../model/UserModel";

export const createUser = async (
  usernameInput: string,
  emailInput: string,
  passwordInput: string,
) => {
  const mostRecentId = await db.user.findFirst({
    select: {
      id: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const user = await db.user.create({
    data: {
      id: mostRecentId.id + 1,
      username: usernameInput,
      email: emailInput,
      password: bcrypt.hashSync(passwordInput, env.HASH_SALT),
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return user;
};

export const queryUserDetailbyID = async (idInput: number) => {
  const data = await db.user.findUnique({
    where: {
      id: idInput,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return data;
};

export const queryUserDetailbyUsername = async (usernameInput: string) => {
  const data = await db.user.findFirst({
    where: {
      username: usernameInput,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return data;
};

export const queryUserDetailbyEmail = async (emailInput: string) => {
  const data = await db.user.findFirst({
    where: {
      email: emailInput,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return data;
};

export const editUser = async (userId: number, data: UserRequest) => {
  const user = await db.user.update({
    where: {
      id: userId,
    },
    data: {
      username: data.username,
      email: data.email,
      password: data.password
        ? bcrypt.hashSync(data.password, env.HASH_SALT)
        : undefined,
    },
  });

  return user;
};

export const removeUser = async (userId: number) => {
  const user = await db.user.update({
    where: {
      id: userId,
    },
    data: {
      deletedAt: new Date(),
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return user;
};
