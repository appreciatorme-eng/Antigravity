const fs = require("node:fs");
const path = require("node:path");

const AUDIT_FILE = path.join(__dirname, "data", "audit-log.jsonl");

function writeAuditEvent(event) {
  const withTime = {
    ...event,
    timestamp: new Date().toISOString()
  };
  fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(withTime)}\n`, "utf8");
}

module.exports = {
  writeAuditEvent,
  AUDIT_FILE
};
