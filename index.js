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
let sock = null; // socket WhatsApp global

// ======= RULE-BASED RESPON CHATBOT =======
function getBotReply(text) {
  text = text.toLowerCase();
  if (text.includes("halo") || text.includes("hai"))
    return "Halo! 👋 Selamat datang di Batik Wistara. Ada yang bisa kami bantu?";
  if (text.includes("produk"))
    return "Kami menyediakan berbagai koleksi batik premium dengan motif khas Nusantara.";
  if (text.includes("harga"))
    return "Harga batik kami mulai dari Rp150.000 hingga Rp500.000, tergantung model dan bahan.";
  if (text.includes("alamat"))
    return "Toko kami berlokasi di Surabaya, Jawa Timur 💙";
  if (text.includes("kontak") || text.includes("whatsapp"))
    return "Hubungi kami di WhatsApp 0812-xxxx-xxxx untuk pemesanan cepat!";
  if (text.includes("terima kasih") || text.includes("makasih"))
    return "Sama-sama 😊 Senang bisa membantu!";
  return "Maaf, saya belum paham 😅. Coba ketik *produk*, *harga*, *alamat*, atau *kontak*.";
}

// ======= MULAI BOT WHATSAPP =======
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    sock = makeWASocket({ auth: state, printQRInTerminal: false });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;
      console.log("DEBUG:", update);

      if (qr) {
        qrCodeData = await qrcode.toDataURL(qr);
        connectionStatus = "📲 QR Code tersedia — silakan scan di /qr";
      }

      if (connection === "open") {
        console.log("✅ Terhubung ke WhatsApp");
        connectionStatus = "✅ Bot aktif dan terhubung ke WhatsApp";
        qrCodeData = "";
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.message || "Terputus";
        console.log("❌ Terputus:", reason);
        connectionStatus = `❌ Terputus: ${reason}`;
        lastError = reason;
        setTimeout(startBot, 5000); // reconnect otomatis
      }
    });

    // 🔁 Saat pesan masuk ke WhatsApp
    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
      const text = msg.message.conversation?.toLowerCase() || "";
      const from = msg.key.remoteJid;

      const reply = getBotReply(text);
      await sock.sendMessage(from, { text: reply });
    });

  } catch (err) {
    console.log("❌ Error startBot:", err.message);
    connectionStatus = `❌ Error: ${err.message}`;
    lastError = err.message;
    setTimeout(startBot, 10000);
  }
}

// ======= ROUTES =======
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

// 🌐 === ENDPOINT UNTUK WEBSITE ===
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ reply: "Pesan kosong." });

  const reply = getBotReply(message);

  // (opsional) kirim juga pesan ke WhatsApp admin
  try {
    if (sock?.user) {
      await sock.sendMessage("62812xxxxxxx@s.whatsapp.net", {
        text: `💬 Chat dari Website: ${message}`,
      });
    }
  } catch (err) {
    console.log("⚠️ Gagal kirim ke admin WA:", err.message);
  }

  res.json({ reply });
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 REST API aktif di port ${port}`));
startBot();
