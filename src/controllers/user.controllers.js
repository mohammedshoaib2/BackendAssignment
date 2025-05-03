import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { options, STATUS_CODES } from "../constants.js";
import { User } from "../models/user.models.js";
import { generateRefreshAndAccessToken } from "../utils/generateTokens.js";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { validateInput } from "../utils/validateInput.js";
import _ from "lodash";

const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    const allowedFields = ["name", "email", "password", "role"];
    //Sanitize the data recieved
    const sanitizedData = sanitizeInput(userData, allowedFields);

    //Validate the data recieved
    const validationResponse = validateInput(sanitizedData, allowedFields);

    if (!validationResponse.valid) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        validationResponse.message
      );
    }

    const { name, email, password, role } = sanitizedData;

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

    //send the data to the user
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
    //sanitize the data recieved
    const sanitizedData = sanitizeInput(userData, allowedFields);

    //validate the data recieved
    const validationResponse = validateInput(sanitizedData, allowedFields);

    if (!validationResponse.valid) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        validationResponse.message
      );
    }
    const { email, password } = sanitizedData;

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

    //send refreshTOken and accessToken as Cokies and json response

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

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (id === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "user id  of the user to delete required"
      );
    }
    const user = req.user;
    const fetchedUser = await User.findById(user._id);

    const checkIfUserAvailable = await User.findById(id);

    if (_.isEmpty(checkIfUserAvailable)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "the user you are trying to delete doesn't exist"
      );
    }

    await User.deleteOne({ _id: id });

    const isUserDeleted = await User.findById(id);

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

const fetchAllUsers = async (req, res) => {
  try {
    const user = req.user;

    const allUsers = await User.find();

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

const fetchUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;
    if (id?.trim() === "") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        null,
        "id of the user is required to fetch"
      );
    }

    const fetchedUser = await User.findById(id);

    if (_.isEmpty(fetchedUser)) {
      throw new ApiError(
        STATUS_CODES.NOT_FOUND,
        null,
        "user with the provided id couldn't be found"
      );
    }

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

const updateUser = async (req, res) => {
  try {
    const user = req.user;
    const allowedFields = ["name", "email", "password", "role"];
    const userData = req.body;
    const sanitizedData = sanitizeInput(userData, allowedFields);
    const updateData = sanitizedData;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

    if (_.isEmpty(updatedUser)) {
      throw new ApiError(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        "user not updated, Something went wrong!"
      );
    }

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
