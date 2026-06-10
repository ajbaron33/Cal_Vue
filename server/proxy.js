import express from "express";
import cors from "cors";

const app = express();
const PORT = 3030;

app.use(cors());

app.get("/ics", async (req, res) => {
  try {
    const target = req.query.url;

    if (!target) {
      return res.status(400).send("Missing url");
    }

    const safeUrl = target.replace(/^webcal:/i, "https:");
    console.log("Fetching ICS:", safeUrl);

    const response = await fetch(safeUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "CalVue/0.1"
      }
    });

    console.log("ICS response:", response.status, response.statusText);

    if (!response.ok) {
      return res
        .status(response.status)
        .send(`Upstream calendar error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    console.log("ICS preview:", text.slice(0, 80));

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.send(text);
  } catch (err) {
    console.error("Proxy failed:", err);
    res.status(500).send(`Failed to fetch calendar: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`CalVue ICS proxy running on http://localhost:${PORT}`);
});