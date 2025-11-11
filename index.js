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
// 💾 STATUS USER (active / paused)
// ===============================
const userStates = new Map(); // { sender: "active" | "paused" }

// ===============================
// 🧠 LOGIKA CHATBOT
// ===============================
async function getBotReply(message) {
  const msg = (message || "").toLowerCase().trim();
  console.log("💬 Pesan diterima:", msg);

  let reply = "";

  try {
    // === MENU PRODUK (1 / produk / katalog) ===
    if (["1", "produk", "katalog"].includes(msg)) {
      const produkRes = await fetch("https://batikwistara.com/api/produk");
      const produkData = await produkRes.json();

      if (!Array.isArray(produkData) || produkData.length === 0) {
        reply = "⚠️ Maaf, katalog produk belum tersedia.";
      } else {
        reply = "🛍️ *Katalog Produk Terbaru:*\n\n";
        produkData.slice(0, 3).forEach((p, i) => {
          reply += `${i + 1}. *${p.nama_produk}*\n💰 Rp${parseInt(p.harga).toLocaleString("id-ID")}\n🔗 https://batikwistara.com/produk/${p.slug}\n\n`;
        });
        reply += "Ketik *0* untuk chat admin, atau lihat semua produk di:\n👉 https://batikwistara.com/katalog";
      }
    }

    // === MENU BERITA (2 / berita) ===
    else if (["2", "berita"].includes(msg)) {
      const beritaRes = await fetch("https://batikwistara.com/api/berita");
      const beritaData = await beritaRes.json();

      if (!Array.isArray(beritaData) || beritaData.length === 0) {
        reply = "⚠️ Belum ada berita terbaru.";
      } else {
        reply = "📰 *Berita Terbaru:*\n\n";
        beritaData.slice(0, 3).forEach((b, i) => {
          reply += `${i + 1}. ${b.judul}\n🔗 https://batikwistara.com/berita/${b.slug}\n\n`;
        });
        reply += "Ketik *0* untuk chat admin, atau lihat semua berita di:\n👉 https://batikwistara.com/berita";
      }
    }

    // === MENU ALAMAT (3 / alamat / lokasi) ===
    else if (["3", "alamat", "lokasi"].includes(msg)) {
      reply = `📍 *Alamat Batik Wistara:*\nJl. Tambak Medokan Ayu VI C No.56B, Medokan Ayu, Kec. Rungkut, Surabaya, Jawa Timur 60295\n🕒 Buka: 08.00–17.00 WIB\n\n🗺️ https://maps.app.goo.gl/WqHPo5eNBDqHykhM8\n\nKetik *0* untuk chat admin.`;
    }

    // === MENU HUBUNGI ADMIN (0 / admin) ===
    else if (["0", "admin"].includes(msg)) {
      reply = `📞 Admin akan segera membalas Anda, Silahkan ketik pertanyaan anda\n\nTerima kasih telah menunggu 🙏\nKetik *menu* jika ingin kembali ke chatbot.`;
    }

    // === MENU UTAMA ===
    else {
      const hour = new Date().getHours();
      const greet =
        hour < 12 ? "Selamat pagi ☀️" : hour < 18 ? "Selamat siang 🌤️" : "Selamat malam 🌙";
      reply = `${greet}!
Selamat datang di *Batik Wistara* 👋

Silakan pilih layanan berikut:
1️⃣ *Produk*
2️⃣ *Berita Terbaru*
3️⃣ *Alamat & Jam Buka*
0️⃣ *Hubungi Admin*

💡 *Balas dengan angka (1–3 atau 0)* untuk memilih menu.`;
    }

    return reply;
  } catch (err) {
    console.error("❌ Error chatbot:", err);
    return "⚠️ Maaf, terjadi kesalahan pada server chatbot.";
  }
}

// ===============================
// 💬 WEBHOOK UNTUK FONNTE (WHATSAPP)
// ===============================
app.post("/api/fonnte-webhook", async (req, res) => {
  try {
    const sender = req.body.sender;
    const message = (req.body.message || "").toLowerCase().trim();

    if (!sender || !message) {
      console.warn("⚠️ Webhook tanpa data pengirim, diabaikan.");
      return res.sendStatus(200);
    }

    const currentState = userStates.get(sender) || "active";

    // ✅ Jika user ketik 'menu' → aktifkan bot kembali
    if (message === "menu") {
      userStates.set(sender, "active");
    }

    // 🚫 Jika user sedang pause dan bukan mengetik 'menu' → abaikan
    if (currentState === "paused" && message !== "menu") {
      console.log(`🤫 ${sender} sedang dalam mode pause, pesan diabaikan.`);
      return res.end("Ignored (paused)");
    }

    // 🧠 Dapatkan balasan chatbot
    const reply = await getBotReply(message);

    // 📴 Jika user mengetik admin / 0, ubah status ke paused
    if (["0", "admin"].includes(message)) {
      userStates.set(sender, "paused");
    }

    // 💬 Kirim ke WhatsApp via Fonnte
    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
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
// 🌐 API UNTUK WEBSITE (optional)
// ===============================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const reply = await getBotReply(message);
  res.json({ reply });
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
app.listen(PORT, () =>
  console.log(`🚀 Wistara Chatbot aktif di port ${PORT}`)
);
