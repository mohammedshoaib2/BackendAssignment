import mongoose from "mongoose";
import { environmentVariables, DB_NAME, STATUS_CODES } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";

const connectDB = async () => {
  try {
    const databaseConnectionInstance = await mongoose.connect(
      `${environmentVariables.mongodbUri}/${DB_NAME}`
    );

    if (!databaseConnectionInstance) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        "Internal Server error, please try again after some time"
      );
    }
    console.log("DB Connected!");
    return databaseConnectionInstance;
  } catch (error) {
    console.log("DB connection error!", error.message);
    throw error;
  }
};

export { connectDB };
