import dotenv from "dotenv";
dotenv.config();

export function apiKey(req, res, next) {
  const header = req.headers["x-api-key"];
  if (!header || header !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
