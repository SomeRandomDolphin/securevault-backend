import db from "../config/connectDb";
import { generateUsers } from "./UserSeed";

async function seedUsers() {
  const users = await generateUsers();

  await Promise.all(
    users.map(async (user) => {
      await db.user.upsert({
        where: {
          id: user.id,
        },
        update: {
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
        },
        create: {
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
        },
      });
    }),
  );
}

async function main() {
  try {
    await seedUsers();
    console.log("Seeding completed successfully");
  } catch (err) {
    console.error("Error during seeding:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
