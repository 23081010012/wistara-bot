import express from "express";
import { getSocket } from "../services/whatsapp.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "to dan message wajib diisi" });

  try {
    const sock = getSocket();
    await sock.sendMessage(to + "@s.whatsapp.net", { text: message });
    res.json({ success: true, to, info: "sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
