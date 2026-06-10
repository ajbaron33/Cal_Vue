import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`CalVue running at http://localhost:${PORT}`);
});