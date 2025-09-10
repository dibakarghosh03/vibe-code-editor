import express, { Request, Response } from "express";
import { resolve } from "path";

const app = express();
const port = process.env.PORT || 3010;

// Serve static files (like CSS, JS, images)
app.use(express.static("static"));

// Serve index.html
app.get("/", (req: Request, res: Response) => {
  res.sendFile(resolve(__dirname, "pages/index.html"));
});

app.listen(port, () => {
  console.log(`🚀 App listening at http://localhost:${port}`);
});
