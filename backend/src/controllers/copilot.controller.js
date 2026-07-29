const { answerCopilotQuestion } = require("../services/copilot.service");

async function chat(request, response, next) {
  try {
    const copilot = await answerCopilotQuestion(request.body);
    response.status(200).json({ success: true, data: copilot });
  } catch (error) { next(error); }
}

module.exports = { chat };
