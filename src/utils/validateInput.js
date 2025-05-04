import _ from "lodash";
import { validateEmail } from "./validateEmail.js";
import { validatePassword } from "./validatePassword.js";
import { ApiError } from "./ApiError.js";
import { STATUS_CODES } from "../constants.js";

const validateInput = (data, requiredFields) => {
  for (const field of requiredFields) {
    //gets value from the data object using the _.get lodash method
    //if the value is null or undefined or empty string then the value holds that value,
    // or if any field is not present in the data object then it will return undefined
    const value = _.get(data, field);

    //check if the value is null or undefined or empty string
    if (_.isNil(value) || (_.isString(value) && _.trim(value) === "")) {
      return {
        valid: false,
        missingField: field,
        message: `${field} is required and must not be empty`,
      };
    }
  }

  return { valid: true };
};

const validateEmailPassword = (email, password) => {
  const isEmailFormatValid = validateEmail(email);
  const isPasswordFormatValid = validatePassword(password);

  if (!isEmailFormatValid) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      null,
      `${email} is not a valid email format`
    );
  }
  if (!isPasswordFormatValid) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      null,
      `password must be atleast 6 characters long`
    );
  }
};

export { validateInput, validateEmailPassword };
