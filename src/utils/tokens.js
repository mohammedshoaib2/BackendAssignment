import jwt from "jsonwebtoken";
import { environmentVariables, STATUS_CODES } from "../constants.js";
import { ApiError } from "./ApiError.js";
const generateAccessToken = (payload) => {
  return jwt.sign(payload, environmentVariables.accessTokenSecret, {
    expiresIn: environmentVariables.accessTokenExpiry,
  });
};
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, environmentVariables.refreshTokenSecret, {
    expiresIn: environmentVariables.refreshTokenExpiry,
  });
};

const verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, environmentVariables.accessTokenSecret);
  } catch (error) {
    throw new ApiError(
      STATUS_CODES.UNAUTHORIZED,
      null,
      "access token expired or incorrect"
    );
  }
};
export { generateAccessToken, generateRefreshToken, verifyJWTToken };
