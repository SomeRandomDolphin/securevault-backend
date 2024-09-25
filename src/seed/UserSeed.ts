import bcrypt from "bcrypt";
import env from "../config/LoacEnv";

export const users = [
  {
    id: 1,
    username: "Gesang Gey",
    email: "gesanggey@gmail.com",
    password: bcrypt.hashSync("gesanggey", env.HASH_SALT),
  },
  {
    id: 2,
    username: "Ivan Wibu",
    email: "ivanwibu@gmail.com",
    password: bcrypt.hashSync("ivanwibu", env.HASH_SALT),
  },
  {
    id: 3,
    username: "Rio Gans",
    email: "riogans@gmail.com",
    password: bcrypt.hashSync("riogans", env.HASH_SALT),
  },
];
