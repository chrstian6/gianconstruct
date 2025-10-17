// scripts/load-env.js
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value.length > 0) {
      process.env[key] = value.join("=").trim();
    }
  });
  console.log("✅ Loaded environment variables from .env.local");
} else {
  console.log("❌ .env.local file not found");
}
