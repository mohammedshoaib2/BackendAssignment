import { generateAccessToken, generateRefreshToken } from "../utils/tokens.js";

const generateRefreshAndAccessToken = async (user) => {
  const accessToken = generateAccessToken({
    _id: user._id,
    email: user.email,
    name: user.name,
  });

  const refreshToken = generateRefreshToken({
    _id: user._id,
  });

  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  return { refreshToken, accessToken };
};

export { generateRefreshAndAccessToken };
