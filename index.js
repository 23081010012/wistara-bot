import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeData = "";
let connectionStatus = "🔄 Starting...";
let lastError = "";
let botStarted = false; // ✅ cegah listen server dua kali

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;
      console.log("DEBUG:", update);

      if (qr) {
        console.log("📱 QR code diterima");
        qrCodeData = await qrcode.toDataURL(qr);
        connectionStatus = "📲 QR Code tersedia — silakan scan";
      }

      if (connection === "open") {
        console.log("✅ Terhubung ke WhatsApp");
        connectionStatus = "✅ Terhubung ke WhatsApp";
        qrCodeData = "";
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.message || "Terputus";
        console.log("❌ Terputus:", reason);
        connectionStatus = `❌ Terputus: ${reason}`;
        lastError = reason;

        setTimeout(() => startBot(), 5000); // hanya reconnect bot, bukan server
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
      const text = msg.message.conversation?.toLowerCase() || "";

      if (text.includes("halo")) {
        await sock.sendMessage(msg.key.remoteJid, { text: "Hai 👋, ini chatbot REST API!" });
      }
    });

  } catch (err) {
    console.log("❌ Error startBot:", err.message);
    connectionStatus = `❌ Error: ${err.message}`;
    lastError = err.message;
    setTimeout(startBot, 10000);
  }
}

// ✅ Jalankan server Express hanya SEKALI
if (!botStarted) {
  botStarted = true;
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 REST API aktif di port ${port}`));
  startBot(); // mulai bot
}

// --- ROUTES ---

app.get("/qr", (req, res) => {
  if (!qrCodeData) {
    return res.send(`
      <html><body style="text-align:center;font-family:sans-serif;">
        <h2>${connectionStatus}</h2>
        <p><a href="/status">Lihat Status</a></p>
      </body></html>
    `);
  }

  res.send(`
    <html><body style="text-align:center;font-family:sans-serif;">
      <h2>Scan QR untuk Login WhatsApp</h2>
      <img src="${qrCodeData}" style="width:300px;height:300px;">
      <p>QR akan refresh otomatis jika expired</p>
      <a href="/status">Lihat Status</a>
    </body></html>
  `);
});

app.get("/status", (req, res) => {
  res.send(`
    <html><body style="text-align:center;font-family:sans-serif;">
      <h2>Status Bot WhatsApp</h2>
      <p style="font-size:20px">${connectionStatus}</p>
      ${lastError ? `<p style="color:red;">${lastError}</p>` : ""}
      <a href="/qr">Lihat QR Code</a>
    </body></html>
  `);
});

app.post("/send", async (req, res) => {
  res.json({
    success: false,
    info: "Bot on, tapi endpoint send perlu koneksi socket global di versi berikut",
  });
});
