import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { STATUS_CODES } from "../constants.js";
import { verifyJWTToken } from "../utils/tokens.js";
import { User } from "../models/user.models.js";
const validateJWT = async (req, res, next) => {
  try {
    //check for the accessToken inside body || header || cookieParser
    const accessToken =
      req?.cookies?.accessToken ||
      req?.body?.accessToken ||
      req?.header("Authorization")?.replace("Bearer ", "")?.trim();

    //check if the accessToken is present or not
    if (!accessToken) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        null,
        "Invalid Access Token, Unauthorized access!"
      );
    }
    //decode the the accessToken
    const decodedAccessToken = verifyJWTToken(accessToken);

    //fetch the user with decoded _id
    const user = await User.findById(decodedAccessToken._id);

    //check if the user is present or not
    //if user is not present then throw an error
    if (!user) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        null,
        "Invalid Access Token, No user Found"
      );
    }

    //add the user to the req as req.user
    req.user = user;
    next();
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

export { validateJWT };
