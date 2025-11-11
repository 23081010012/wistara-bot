// ===============================
// 🤖 WISTARA CHATBOT REST API (Web + WhatsApp Fonnte)
// ===============================
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_WA = process.env.ADMIN_WA || "62895381110035";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

// ===============================
// 🧠 LOGIKA CHATBOT (DIGUNAKAN DI WEBSITE & WHATSAPP)
// ===============================
async function getBotReply(message) {
  const msg = (message || "").toLowerCase().trim();
  console.log("💬 Pesan diterima:", msg);

  let reply = "";

  try {
    // === Menu Produk ===
    if (msg.includes("produk") || msg.includes("katalog")) {
      const produkRes = await fetch("https://batikwistara.com/api/produk");
      const produkData = await produkRes.json();

      if (!Array.isArray(produkData) || produkData.length === 0) {
        reply = "⚠️ Maaf, katalog produk belum tersedia.";
      } else {
        reply = "🛍️ *Katalog Produk Terbaru:*\n\n";
        produkData.slice(0, 3).forEach((p, i) => {
          reply += `${i + 1}. *${p.nama_produk}*\n💰 Rp${parseInt(p.harga).toLocaleString("id-ID")}\n🔗 https://batikwistara.com/produk/${p.slug}\n\n`;
        });
        reply += "Ketik *admin* untuk tanya produk atau klik link katalog 👇\nhttps://batikwistara.com/katalog";
      }
    }

    // === Menu Berita ===
    else if (msg.includes("berita")) {
      const beritaRes = await fetch("https://batikwistara.com/api/berita");
      const beritaData = await beritaRes.json();

      if (!Array.isArray(beritaData) || beritaData.length === 0) {
        reply = "⚠️ Belum ada berita terbaru.";
      } else {
        reply = "📰 *Berita Terbaru:*\n\n";
        beritaData.slice(0, 3).forEach((b, i) => {
          reply += `${i + 1}. ${b.judul}\n🔗 https://batikwistara.com/berita/${b.slug}\n\n`;
        });
      }
    }

    // === Menu Alamat ===
    else if (msg.includes("alamat") || msg.includes("lokasi")) {
      reply = `📍 *Alamat Batik Wistara:*\nJl. Ketintang No.88, Surabaya\n🕒 Buka: 09.00–17.00 WIB\n\n🗺️ https://maps.app.goo.gl/TY4uB1QNy72n97FYA`;
    }

    // === Menu Hubungi Admin ===
    else if (msg.includes("admin") || msg === "0") {
      reply = `📞 Silakan klik link berikut untuk chat langsung dengan admin kami:\n👉 https://wa.me/${ADMIN_WA}?text=Halo%20admin%2C%20saya%20ingin%20bertanya.`;
    }

    // === Menu Utama ===
    else {
      const hour = new Date().getHours();
      const greet =
        hour < 12 ? "Selamat pagi ☀️" : hour < 18 ? "Selamat siang 🌤️" : "Selamat malam 🌙";
      reply = `${greet}!\nSelamat datang di *Batik Wistara*.\nSilakan pilih layanan berikut:\n\n1️⃣ Produk\n2️⃣ Berita Terbaru\n3️⃣ Alamat & Jam Buka\n0️⃣ Hubungi Admin`;
    }

    return reply;
  } catch (err) {
    console.error("❌ Error chatbot:", err);
    return "⚠️ Maaf, terjadi kesalahan pada server chatbot.";
  }
}

// ===============================
// 🌐 CHATBOT UNTUK WEBSITE
// ===============================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const reply = await getBotReply(message);
  res.json({ reply });
});

// ===============================
// 💬 CHATBOT UNTUK WHATSAPP (WEBHOOK FONNTE)
// ===============================
app.post("/api/fonnte-webhook", async (req, res) => {
  try {
    console.log("📥 Webhook Fonnte:", req.body);

    const sender = req.body.sender;
    const message = req.body.message;

    if (!sender || !message) {
      console.warn("⚠️ Webhook tanpa data pengirim, diabaikan.");
      return res.sendStatus(200);
    }

    // Dapatkan balasan otomatis dari bot
    const reply = await getBotReply(message);

    // Kirim ke WhatsApp via API Fonnte
    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: "gxmbpys5Ysp8TNJeBaUo",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: sender,
        message: reply,
      }),
    });

    const result = await fonnteRes.json();
    console.log("✅ Balasan terkirim ke WA:", result);

    res.end("OK");
  } catch (err) {
    console.error("❌ Error webhook Fonnte:", err);
    res.sendStatus(500);
  }
});

// ===============================
// ⚙️ STATUS SERVER
// ===============================
app.get("/", (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif; text-align:center; padding-top:40px;">
      <h2>✅ Wistara Chatbot Aktif</h2>
      <p>🌐 Website API: <code>/api/chat</code></p>
      <p>💬 WhatsApp Webhook: <code>/api/fonnte-webhook</code></p>
    </body></html>
  `);
});

// ===============================
// 🚀 JALANKAN SERVER
// ===============================
app.listen(PORT, () => console.log(`🚀 Wistara Chatbot aktif di port ${PORT}`));
