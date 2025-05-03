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
      user: user._id,
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

const fetchTasks = async (req, res) => {
  try {
    const user = req.user;

    const allUserTasks = await Task.find({ user: user._id });

    res.status(STATUS_CODES.OK).json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          all_tasks: allUserTasks,
        },
        "all tasks of the user fetched successfully!"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

const deleteTask = async (req, res) => {
  try {
    const currentUser = req.user;

    const taskId = req.params.id;
    if (taskId?.trim() === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "id is required to delete user"
      );
    }

    const fetchedTask = await Task.findById(taskId);
    if (_.isEmpty(fetchedTask)) {
      throw new ApiError(
        STATUS_CODES.NOT_FOUND,
        null,
        "no task was found with the provided task id"
      );
    }

    const isCurrentUserAndTaskUserSame = _.isEqual(
      String(fetchedTask.user),
      String(currentUser._id)
    );
    fetchedTask.user === currentUser._id;
    if (!isCurrentUserAndTaskUserSame) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        null,
        "cannot delete other users tasks "
      );
    }
    await Task.deleteOne({ _id: taskId });

    res.status(STATUS_CODES.OK).json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          deleted_user: fetchedTask,
        },
        "task deleted successfully!"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const taskData = req.body;
    const currentUser = req.user;
    const allowedFields = ["title", "description"];
    const sanitizedData = sanitizeInput(taskData, allowedFields);

    if (taskId.trim() === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "task id is required to update the task"
      );
    }
    const fetchedTask = await Task.findById(taskId);

    if (_.isEmpty(fetchedTask)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "no task was found with the provided task id"
      );
    }

    const isCurrentUserAndTaskUserSame = _.isEqual(
      String(fetchedTask.user),
      String(currentUser._id)
    );

    if (!isCurrentUserAndTaskUserSame) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "cannot edit other users task"
      );
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: sanitizedData,
      },
      {
        new: true,
      }
    );

    if (_.isEmpty(updatedTask)) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "task not updated, Something went wrong!"
      );
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      new ApiResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        {
          updated_task: updatedTask,
        },
        "task updated successfully!"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

const fetchAllTasks = async (req, res) => {
  try {
    const allTasks = await Task.find().populate("user");

    res.status(STATUS_CODES.OK).json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          all_tasks: allTasks,
        },
        "all tasks fetched successfully!"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

export { addTask, fetchTasks, deleteTask, updateTask, fetchAllTasks };
