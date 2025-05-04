import { STATUS_CODES } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const auhtorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    //get the current user role from req.user which is injected by the middleware validateJWT
    const currentUserRole = req.user;

    //check if the current user role is present or not
    if (allowedRoles.includes(currentUserRole.role)) {
      //if the current user role is present then call the next middleware
      next();
    } else {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json(
          new ApiResponse(
            STATUS_CODES.UNAUTHORIZED,
            null,
            `only ${allowedRoles} can access the route`
          )
        );
    }
  };
};

export { auhtorizeRole };
