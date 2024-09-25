import jwt from "jsonwebtoken";
import env from "../config/LoacEnv";

enum TokenExpiredDuration {
  ACCESS_TOKEN_DURATION = "30m",
}

export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, env.SECRET_ACCESS_TOKEN, {
    expiresIn: TokenExpiredDuration.ACCESS_TOKEN_DURATION,
  });
};
