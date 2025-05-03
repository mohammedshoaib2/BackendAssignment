import express, { urlencoded } from "express";
import { environmentVariables, STATUS_CODES } from "./constants.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import taskRouter from "./routes/task.routes.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: environmentVariables.corsOrigin,
    credentials: true,
  })
);

app.use(
  urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/task", taskRouter);
export { app };
