import _ from "lodash";
const sanitizeInput = (data, allowedFields) => {
  const picked = _.pick(data, allowedFields);

  const sanitized = {};
  for (const key in picked) {
    if (!key.includes("$") && !key.includes(".")) {
      sanitized[key] = picked[key];
    }
  }

  return sanitized;
};

export { sanitizeInput };
