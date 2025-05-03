import _ from "lodash";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { validateInput } from "../utils/validateInput.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { STATUS_CODES } from "../constants.js";
import { Task } from "../models/task.models.js";

const addTask = async (req, res) => {
  try {
    const allowedFields = ["title", "description"];
    const taskData = req.body;
    const user = req.user; //user is injected to req from the middleware validateJWT
    //sanitize the data
    const sanitizedData = sanitizeInput(taskData, allowedFields); //with lodash

    //validate the data
    const validationResponse = validateInput(taskData, allowedFields); //with lodash

    if (!validationResponse.valid) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        validationResponse.message
      );
    }

    //add task to the DB
    const addedTask = await Task.create({
      title: sanitizedData.title,
      description: sanitizedData.description,
      userId: user._id,
    });

    if (!addedTask) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "task not added, Something went wrong!"
      );
    }

    //respond with the added task

    res.status(STATUS_CODES.CREATED).json(
      new ApiResponse(STATUS_CODES.CREATED, {
        task: addedTask,
      })
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

export { addTask };
