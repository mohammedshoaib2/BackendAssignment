import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { environmentVariables } from "./constants.js";

dotenv.config({
  path: "../.env",
});

const PORT = environmentVariables.port || 3000 || 5000;

connectDB()
  .then((databaseResponse) => {
    app.listen(PORT, () => {
      console.log("listening at port : ", PORT);
    });
  })
  .catch((error) => {
    console.log("DB connection error!", error.message);
    process.exit(1);
  });
