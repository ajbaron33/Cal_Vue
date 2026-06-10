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

    const response = await fetch(safeUrl);
    const text = await response.text();

    res.setHeader("Content-Type", "text/calendar");
    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch calendar");
  }
});

app.listen(PORT, () => {
  console.log(`CalVue ICS proxy running on http://localhost:${PORT}`);
});