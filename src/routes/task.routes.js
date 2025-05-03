import { Router } from "express";
import { validateJWT } from "../middlewares/auth.middlewares.js";
import { auhtorizeRole } from "../middlewares/role.middlewares.js";
import {
  addTask,
  fetchTasks,
  deleteTask,
  updateTask,
  fetchAllTasks,
} from "../controllers/task.controllers.js";

const router = Router();

//protected routes
router
  .route("/add-task")
  .post(validateJWT, auhtorizeRole(["admin", "user"]), addTask);
router
  .route("/fetch-tasks")
  .get(validateJWT, auhtorizeRole(["admin", "user"]), fetchTasks); //fetchs all user-specific tasks
router
  .route("/delete-task/:id")
  .delete(validateJWT, auhtorizeRole(["admin", "user"]), deleteTask);
router
  .route("/update-task/:id")
  .put(validateJWT, auhtorizeRole(["admin", "user"]), updateTask);

router
  .route("/fetch-all-tasks")
  .get(validateJWT, auhtorizeRole(["admin"]), fetchAllTasks);

export default router;
