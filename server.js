const express = require("express");
const { chromium } = require("@playwright/test");

const app = express();
app.use(express.json());

const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
if (!AUTH_PASSWORD) {
  console.error("[FATAL] AUTH_PASSWORD environment variable is required!");
  process.exit(1);
}

// --- AUTH middleware ---
app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[WARN] Missing or invalid Authorization header");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring("Bearer ".length);
  if (token !== AUTH_PASSWORD) {
    console.warn("[WARN] Invalid auth token");
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});

// --- FETCH endpoint ---
app.post("/fetch", async (req, res) => {
  const targetUrl = req.body.url;
  if (!targetUrl) {
    console.log("[WARN] Missing 'url' in request body");
    return res.status(400).json({ error: "Missing 'url' in request body" });
  }

  console.log(`[INFO] Fetch request received for: ${targetUrl}`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      locale: "hu-HU",
    });

    const page = await context.newPage();

    const response = await page.goto(targetUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const status = response ? response.status() : 0;
    const finalUrl = page.url();
    const body = await page.content();

    console.log(
      `[INFO] Fetch success: ${targetUrl} -> ${finalUrl} [status=${status}]`
    );

    res.json({
      url: finalUrl,
      status,
      body,
    });
  } catch (err) {
    console.error(`[ERROR] Fetch failed for ${targetUrl}:`, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// --- Start server ---
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`[INFO] Playwright fetch API listening on port ${PORT}`);
});

// --- Graceful shutdown ---
function shutdown(signal) {
  console.log(`[INFO] Caught ${signal}, shutting down...`);
  server.close(() => {
    console.log("[INFO] HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
