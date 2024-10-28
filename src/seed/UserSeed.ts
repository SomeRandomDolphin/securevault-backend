import bcrypt from "bcrypt";
import env from "../config/LoacEnv";
import { generateKeyPairs } from "../Utils/KeyManagement";

export const generateUsers = async () => {
  const userTemplates = [
    {
      id: 1,
      username: "Gesang Gey",
      email: "gesanggey@gmail.com",
      password: "gesanggey",
    },
    {
      id: 2,
      username: "Ivan Wibu",
      email: "ivanwibu@gmail.com",
      password: "ivanwibu",
    },
    {
      id: 3,
      username: "Rio Gans",
      email: "riogans@gmail.com",
      password: "riogans",
    },
  ];

  const users = await Promise.all(
    userTemplates.map(async (user) => {
      const { publicKey, privateKey } = await generateKeyPairs(user.password);
      return {
        ...user,
        password: bcrypt.hashSync(user.password, env.HASH_SALT),
        publicKey,
        privateKey
      };
    })
  );

  return users;
};