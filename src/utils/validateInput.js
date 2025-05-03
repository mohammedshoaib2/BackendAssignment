import _ from "lodash";
function validateInput(data, requiredFields) {
  for (const field of requiredFields) {
    const value = _.get(data, field);

    if (_.isNil(value) || (_.isString(value) && _.trim(value) === "")) {
      return {
        valid: false,
        missingField: field,
        message: `${field} is required and must not be empty`,
      };
    }
  }

  return { valid: true };
}

export { validateInput };
