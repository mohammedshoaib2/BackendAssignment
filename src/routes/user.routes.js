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

const router = Router();

//unprotected routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

//protected routes
router.route("/logout").post(validateJWT, logoutUser);
router.route("/delete-user/:id").delete(validateJWT, deleteUser);
router.route("/fetch-all-users").get(validateJWT, fetchAllUsers);
router.route("/fetch-user/:id").get(validateJWT, fetchUser);
router.route("/update-user").put(validateJWT, updateUser);

export default router;
