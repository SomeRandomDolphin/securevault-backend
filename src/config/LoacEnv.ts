/* eslint-disable */
import { config } from "dotenv";
import { cleanEnv, str, url, num, EnvError, EnvMissingError } from "envalid";

config();

const env = cleanEnv(
  process.env,
  {
    DATABASE_URL: url(),
    PORT: num(),
    SECRET_ACCESS_TOKEN: str(),
    HASH_SALT: str(),
  },
  {
    reporter: ({ errors, env }) => {
      if (Object.keys(errors).length > 0) {
        for (const [key, value] of Object.entries(errors)) {
          if (value instanceof EnvError) {
            console.log("Environment variable error: ", key);
          } else if (value instanceof EnvMissingError) {
            console.log("Environment variable missing: ", key);
          } else {
            console.log("something went wrong: ", errors);
          }
        }

        process.exit(1);
      }
    },
  },
);

export default env;
