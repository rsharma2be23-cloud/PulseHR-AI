function getHealthStatus(_request, response) {
  response.status(200).json({
    success: true,
    message: "PulseHR API is running",
  });
}

module.exports = { getHealthStatus };
