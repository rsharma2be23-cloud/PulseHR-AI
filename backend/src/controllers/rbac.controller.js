function accessGranted(request, response) {
  response.status(200).json({
    success: true,
    message: "Access granted.",
    data: { role: request.user.role },
  });
}

module.exports = { accessGranted };
