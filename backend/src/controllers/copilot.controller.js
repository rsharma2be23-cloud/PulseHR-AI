const { answerCopilotQuestion } = require("../services/copilot.service");
const { ApiError } = require("../utils/apiError");

async function chat(request, response, next) {
  try {
    const copilot = await answerCopilotQuestion(request.body);
    response.status(200).json({ success: true, data: copilot });
  } catch (error) {
    console.error(`[HR Copilot] Chat request failed: ${error.message}`);
    if (error instanceof ApiError && [502, 503, 504].includes(error.statusCode)) {
      return response.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
}

module.exports = { chat };
