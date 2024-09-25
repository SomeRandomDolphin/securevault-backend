import db from "../config/connectDb";

export const queryUserById = async (userId: number) => {
  return await db.user.findUnique({
    where: {
      id: userId,
    },
  });
};

export const queryUserByEmail = async (email: string) => {
  return await db.user.findFirst({
    where: {
      email: email,
    },
  });
};

export const queryUserByUsername = async (username: string) => {
  return await db.user.findFirst({
    where: {
      username: username,
    },
  });
};
