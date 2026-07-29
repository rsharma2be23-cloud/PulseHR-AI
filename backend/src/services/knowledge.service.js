const { searchKnowledge } = require("../clients/knowledge.client");

async function retrieveKnowledge(search) {
  return searchKnowledge(search);
}

module.exports = { retrieveKnowledge };
