const { retrieveKnowledge } = require("../services/knowledge.service");

async function search(request, response, next) {
  try {
    const results = await retrieveKnowledge(request.body);
    response.status(200).json({ success: true, data: { results } });
  } catch (error) { next(error); }
}

module.exports = { search };
