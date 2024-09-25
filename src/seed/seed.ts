import db from "../config/connectDb";
import { users } from "./UserSeed";

async function seedUsers() {
  users.forEach(async (user) => {
    await db.user.upsert({
      where: {
        id: user.id,
      },
      update: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
      },
      create: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
      },
    });
  });
}

async function main() {
  try {
    seedUsers();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
