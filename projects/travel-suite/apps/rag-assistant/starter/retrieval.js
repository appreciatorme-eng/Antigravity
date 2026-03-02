const fs = require("node:fs");
const path = require("node:path");

const FAQ_PATH = path.join(__dirname, "..", "faq", "faq_tour_operator.jsonl");

function loadFaqRows() {
  const lines = fs.readFileSync(FAQ_PATH, "utf8").split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

function scoreMatch(queryTokens, row) {
  const answerTokens = tokenize(`${row.question} ${row.answer}`);
  let overlap = 0;
  queryTokens.forEach((token) => {
    if (answerTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
}

function retrieveFaqContext({ query, maxChunks = 6 }) {
  const rows = loadFaqRows();
  const queryTokens = tokenize(query);
  return rows
    .map((row) => ({ row, score: scoreMatch(queryTokens, row) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((item) => item.row);
}

module.exports = {
  retrieveFaqContext
};
