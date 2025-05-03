import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { options, STATUS_CODES } from "../constants.js";
import { User } from "../models/user.models.js";
import { generateRefreshAndAccessToken } from "../utils/generateTokens.js";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import {
  validateEmailPassword,
  validateInput,
} from "../utils/validateInput.js";
import _ from "lodash";
import bcrypt from "bcrypt";
import { validateEmail } from "../utils/validateEmail.js";
import { validatePassword } from "../utils/validatePassword.js";

const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    const allowedFields = ["name", "email", "password", "role"];
    //Sanitize the data recieved : removes if any noSQL injections and unwanted fields from req.body
    const sanitizedData = sanitizeInput(userData, allowedFields);

    //Validate the data recieved : checks if all the fields required are available
    const validationResponse = validateInput(sanitizedData, allowedFields);

    if (!validationResponse.valid) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        validationResponse.message
      );
    }

    const { name, email, password, role } = sanitizedData;

    //validation of email and passowrd format
    validateEmailPassword(email, password);

    //check if user with email already exists
    const isUserExits = await User.findOne({ email });
    if (!_.isEmpty(isUserExits)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "the user with email already exists!"
      );
    }

    //create the user with the recieved name, email, role and password
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    //check if user has been created
    const createdUser = await User.findOne({ email }).select("-password");
    if (_.isEmpty(createdUser)) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "User not created successfully due to internal server error, please try again!"
      );
    }

    //send the data to the client
    res.status(STATUS_CODES.CREATED).json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        {
          user: createdUser,
        },
        "User has been created successfully"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

const loginUser = async (req, res) => {
  try {
    const userData = req.body;
    const allowedFields = ["email", "password"];
    //Sanitize the data recieved : removes if any noSQL injections and unwanted fields from req.body
    const sanitizedData = sanitizeInput(userData, allowedFields);

    //Validate the data recieved : checks if all the fields required are available
    const validationResponse = validateInput(sanitizedData, allowedFields);

    if (!validationResponse.valid) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        validationResponse.message
      );
    }
    const { email, password } = sanitizedData;

    //validation of email and passowrd format
    validateEmailPassword(email, password);

    //check user exist with the email
    const user = await User.findOne({ email });
    if (_.isEmpty(user)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "user does not exists with the provided email"
      );
    }

    //check if password is valid
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, null, "incorrect password");
    }

    //generate refreshToken and accessToken
    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
      user
    );

    //send refreshTOken and accessToken as Cokies and a user in json response
    res
      .status(STATUS_CODES.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          STATUS_CODES.OK,
          {
            user: user,
            refreshToken: refreshToken,
            accessToken: accessToken,
          },
          "user logged in successfully!"
        )
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

const logoutUser = async (req, res) => {
  try {
    //get user
    const user = req.user;
    //remove refreshTOken from user db
    const fetchedUser = await User.findByIdAndUpdate(user._id, {
      $set: {
        refreshToken: null,
      },
    });

    //remove refreshToken and accessToken from client cookies
    res
      .status(STATUS_CODES.OK)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        new ApiResponse(STATUS_CODES.OK, null, "user logged out successfully!")
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

//only admin can delete user
const deleteUser = async (req, res) => {
  try {
    //get id from params
    const id = req.params.id;
    if (id === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "user id  of the user to delete required"
      );
    }

    //get user from req
    const user = req.user;

    //check if the user available in the DB
    const checkIfUserAvailable = await User.findById(id);

    //throw error if the user not present in DB
    if (_.isEmpty(checkIfUserAvailable)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "the user you are trying to delete doesn't exist"
      );
    }

    //delete user
    await User.deleteOne({ _id: id });

    //check if user deleted from DB
    const isUserDeleted = await User.findById(id);

    //if we get the response as an valid user object we should throw an error as the user is not deleted from the DB
    if (!_.isEmpty(isUserDeleted)) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "unable to delete user"
      );
    }

    res.status(STATUS_CODES.OK).json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          deleted_user: checkIfUserAvailable,
        },
        "user successfully deleted"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

//only admin can fetch all users
const fetchAllUsers = async (req, res) => {
  try {
    //find all users from the DB
    const allUsers = await User.find();

    //send response to the client
    res.status(STATUS_CODES.OK).json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          all_users: allUsers,
        },
        "all users fetched successfully"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

//only admin can fetch any sepcific user with the id
const fetchUser = async (req, res) => {
  try {
    //get id from the params
    const id = req.params.id;

    //validate if the id is not empty
    if (id?.trim() === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "id of the user is required to fetch"
      );
    }

    //fetch the user with the id
    const fetchedUser = await User.findById(id);

    //if no user found then throw an error
    if (_.isEmpty(fetchedUser)) {
      throw new ApiError(
        STATUS_CODES.NOT_FOUND,
        null,
        "user with the provided id couldn't be found"
      );
    }

    //send response
    res.status(STATUS_CODES.OK).json(
      new ApiResponse(STATUS_CODES.OK, {
        user: fetchedUser,
      }),
      "user fetched successfully"
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

//only the owner can update the user details
const updateUser = async (req, res) => {
  try {
    //get current user form req.user
    const user = req.user;

    //create an array of allowed fields for sanitization and validation
    const allowedFields = ["name", "email", "password", "role"];

    //get user payload data from req.body
    const userData = req.body;

    //sanitize the data
    const sanitizedData = sanitizeInput(userData, allowedFields);
    const updateData = sanitizedData;

    const { email, password } = updateData;

    //validate email and password
    const isEmailFormatValid = validateEmail(email);
    const isPasswordFormatValid = validatePassword(password);

    //check if the email or password as a key present in the req payload to verify that user is intended to edit either one
    if (!isEmailFormatValid && Object.keys(updateData).includes("email")) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        `${email} is not a valid email format`
      );
    }
    if (
      !isPasswordFormatValid &&
      Object.keys(updateData).includes("password")
    ) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        `password must be atleast 6 characters long`
      );
    }

    if (Object.keys(updateData).includes("password")) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    }
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

    //if the response after updating the user is empty || null || undefined, it may be because the user data is not being updated

    if (_.isEmpty(updatedUser)) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "user not updated, Something went wrong!"
      );
    }

    //send response to the client
    res.status(STATUS_CODES.OK).json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          updated_user: updatedUser,
        },
        "user data is updated successfully"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  deleteUser,
  fetchAllUsers,
  fetchUser,
  updateUser,
};
