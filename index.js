import express from "express";
import sendRoutes from "./routes/send.js";
import webhookRoutes from "./routes/webhook.js";
import { startWhatsApp } from "./services/whatsapp.js";

const app = express();
app.use(express.json());

// Jalankan bot WhatsApp
await startWhatsApp();

// Daftarkan route API
app.use("/api/send", sendRoutes);
app.use("/api/webhook", webhookRoutes);

app.get("/", (req, res) => res.send("🚀 Batik Wistara REST API Bot aktif!"));

app.listen(3000, () => console.log("🌐 Server berjalan di http://localhost:3000"));
