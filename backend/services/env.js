const fs = require("fs");
const path = require("path");

function load(envPath) {
  const resolved = envPath ? path.resolve(envPath) : path.join(__dirname, "..", ".env");
  try {
    const content = fs.readFileSync(resolved, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && !(key in process.env)) process.env[key] = value;
    }
  } catch {}
}

module.exports = { load };
