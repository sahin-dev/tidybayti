const createErrorMessage = require("../util/createErrorMessage");

const handleNetworkError = (error) => {
  let message;
  const { code, message: defaultMsg } = error;

  switch (code) {
    case "ECONNRESET":
      message = "Server is not responding";
      break;
    case "EHOSTUNREACH":
      message = "The server is unreachable";
      break;
    case "ETIMEDOUT":
      message = "The connection timed out";
    case "EADDRINUSE":
      message = "The port is running somewhere else";
      break;
    default:
      message = defaultMsg || "A network error occurred";
  }

  return {
    statusCode: 503,
    message,
    errorMessages: createErrorMessage(message),
  };
};

module.exports = handleNetworkError;
