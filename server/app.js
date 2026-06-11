import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";

const app = express();
const PORT = process.env.PORT || 3030;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

app.use(cors());

app.get("/ics", async (req, res) => {
  try {
    const target = req.query.url;

    if (!target) {
      return res.status(400).send("Missing url");
    }

    const safeUrl = target.replace(/^webcal:/i, "https:");

    const response = await fetch(safeUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "CalVue/0.1"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.status}`);
    }

    const text = await response.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.send(text);
  } catch (err) {
    console.error("ICS proxy failed:", err);
    res.status(500).send(`Failed to fetch calendar: ${err.message}`);
  }
});

app.get("/icue-test", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <body style="background:#111;color:#00ff99;font-family:Arial;padding:20px;">
        <h1>iCUE Test Works</h1>
      </body>
    </html>
  `);
});

app.get("/api/outlook/events", (req, res) => {
  execFile(
    "powershell.exe",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      "C:\\Apps\\Cal_Vue\\server\\outlook-events.ps1",
    ],
    { windowsHide: true },
    (error, stdout, stderr) => {
      if (error) {
        console.error("Outlook script error:", error, stderr);
        return res.status(500).json({ error: "Failed to read Outlook events" });
      }

      try {
        const events = stdout.trim() ? JSON.parse(stdout) : [];
        res.json(Array.isArray(events) ? events : [events]);
      } catch (err) {
        console.error("Outlook JSON parse error:", err, stdout);
        res.status(500).json({ error: "Failed to parse Outlook events" });
      }
    }
  );
});

app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`CalVue running at http://localhost:${PORT}`);
});