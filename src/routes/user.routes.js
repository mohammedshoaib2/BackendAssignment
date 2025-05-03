import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  deleteUser,
  fetchAllUsers,
  fetchUser,
  updateUser,
} from "../controllers/user.controllers.js";

import { validateJWT } from "../middlewares/auth.middlewares.js";
import { auhtorizeRole } from "../middlewares/role.middlewares.js";

const router = Router();

//unprotected routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

//protected routes - User Routes
router
  .route("/logout")
  .post(validateJWT, auhtorizeRole(["admin", "user"]), logoutUser);
router
  .route("/delete-user/:id")
  .delete(validateJWT, auhtorizeRole(["admin"]), deleteUser); //Admin route
router
  .route("/fetch-all-users")
  .get(validateJWT, auhtorizeRole(["admin"]), fetchAllUsers); //Admin route
router
  .route("/fetch-user/:id")
  .get(validateJWT, auhtorizeRole(["admin"]), fetchUser); //Admin route
router
  .route("/update-user")
  .put(validateJWT, auhtorizeRole(["admin", "user"]), updateUser);

export default router;
