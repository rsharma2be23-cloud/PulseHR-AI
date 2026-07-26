const { ApiError } = require("../utils/apiError");

function validate(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(new ApiError(400, "Validation failed.", details));
    }

    request.body = result.data;
    return next();
  };
}

module.exports = { validate };
