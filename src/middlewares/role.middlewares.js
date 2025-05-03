import { STATUS_CODES } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const auhtorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    const currentUserRole = req.user;
    if (allowedRoles.includes(currentUserRole.role)) {
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
