import _ from "lodash";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { validateInput } from "../utils/validateInput.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { STATUS_CODES } from "../constants.js";
import { Task } from "../models/task.models.js";
const addTask = async (req, res) => {
  try {
    //make an array of allowed fields for sanitization and validation
    const allowedFields = ["title", "description"];

    //get the task payload data form req
    const taskData = req.body;

    //get the current user which is injected by the middleware validateJWT
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

    //check if the task was added or not
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
    //get the current user from the req
    const user = req.user;

    //get all the Tasks specific to the current user from the DB
    const allUserTasks = await Task.find({ user: user._id });

    //send response to the client
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
    //get current user from the req
    const currentUser = req.user;

    //get the task id from the req params
    const taskId = req.params.id;
    if (taskId?.trim() === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "id is required to delete user"
      );
    }

    //validation of email and password format
    const fetchedTask = await Task.findById(taskId);
    if (_.isEmpty(fetchedTask)) {
      throw new ApiError(
        STATUS_CODES.NOT_FOUND,
        null,
        "no task was found with the provided task id"
      );
    }

    //check if the current user is same as the task user
    //if not then throw an error
    //if yes then delete the task
    const isCurrentUserAndTaskUserSame = _.isEqual(
      String(fetchedTask.user),
      String(currentUser._id)
    );

    //if the current user is not the same as the task user then throw an error
    //if the current user is the same as the task user then delete the task
    fetchedTask.user === currentUser._id;
    if (!isCurrentUserAndTaskUserSame) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        null,
        "cannot delete other users tasks "
      );
    }

    //delete the task from the DB
    await Task.deleteOne({ _id: taskId });

    //send response to the client
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
    //get the task id from the req params
    const taskId = req.params.id;

    //get the task data from the req body
    const taskData = req.body;

    //get the current user from the req
    const currentUser = req.user;

    // make an array of allowed fields for sanitization and validation
    const allowedFields = ["title", "description"];

    // sanitize the data
    const sanitizedData = sanitizeInput(taskData, allowedFields);

    // validate the params

    if (
      Object.values(sanitizedData).some((value) => {
        return _.isEmpty(value.trim());
      })
    ) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "fields to update must not be empty!"
      );
    }
    if (taskId.trim() === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "task id is required to update the task"
      );
    }
    //fetch the task from the DB
    const fetchedTask = await Task.findById(taskId);

    //check if the task exists or not
    //if not then throw an error
    if (_.isEmpty(fetchedTask)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "no task was found with the provided task id"
      );
    }

    //check if the current user is same as the task user
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

    //find and update the task in the DB
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: sanitizedData,
      },
      {
        new: true,
      }
    );

    //check if the task was updated or not
    if (_.isEmpty(updatedTask)) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "task not updated, Something went wrong!"
      );
    }

    //send response to the client
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

//only admin can fetch all tasks
const fetchAllTasks = async (req, res) => {
  try {
    //get the current user from the req
    const allTasks = await Task.find().populate("user");

    //send response to the client
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
