import { Router } from "express";
import { validateJWT } from "../middlewares/auth.middlewares.js";
import { addTask } from "../controllers/task.controllers.js";

const router = Router();

router.route("/add-task").post(validateJWT, addTask);

export default router;
