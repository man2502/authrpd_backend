function successResponse(data, message = null) {
  const response = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return response;
}

module.exports = {
  successResponse,
};

