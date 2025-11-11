// ===============================
// 🤖 WISTARA CHATBOT REST API (Web + WhatsApp Fonnte + API Laravel Unified)
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

// 🔁 Map untuk menyimpan sesi aktif user
const activeSessions = new Map();

// ===============================
// 🧠 LOGIKA CHATBOT (Unified)
// ===============================
async function getBotReply(sender, message) {
  const msg = (message || "").toLowerCase().trim();
  console.log("💬 Pesan dari", sender, ":", msg);

  // Jika sedang dalam mode admin
  if (activeSessions.get(sender) === "pause") {
    if (msg === "menu") {
      activeSessions.delete(sender);
      return "✨ *Chatbot diaktifkan kembali!*\nSilakan ketik angka 1–4 untuk memilih menu.";
    }
    return null;
  }

  let reply = "";

  try {
    // === MENU PRODUK ===
    if (["1", "produk", "katalog"].includes(msg)) {
      const res = await fetch("https://batikwistara.com/api/produk");
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        reply = "⚠️ Maaf, katalog produk belum tersedia.";
      } else {
        reply = "🛍️ *Katalog Produk Terbaru:*\n\n";
        data.slice(0, 3).forEach((p, i) => {
          reply += `${i + 1}. *${p.nama_produk}*\n💰 Rp${parseInt(p.harga).toLocaleString("id-ID")}\n🔗 https://batikwistara.com/produk/${p.slug}\n\n`;
        });
        reply += "Ketik *0* untuk chat admin, atau lihat semua produk di:\n👉 https://batikwistara.com/katalog";
      }
    }

    // === MENU BERITA ===
    else if (["2", "berita"].includes(msg)) {
      const res = await fetch("https://batikwistara.com/api/berita");
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        reply = "⚠️ Belum ada berita terbaru.";
      } else {
        reply = "📰 *Berita Terbaru:*\n\n";
        data.slice(0, 3).forEach((b, i) => {
          reply += `${i + 1}. ${b.judul}\n🔗 https://batikwistara.com/berita/${b.slug}\n\n`;
        });
      }
    }

    // === MENU CEK PESANAN ===
    else if (["4", "cek", "pesanan"].some(k => msg.includes(k))) {
      const id = msg.replace(/cek|pesanan/gi, "").trim();

      if (!id) {
        reply = "🔍 Silakan kirim *cek [ID pesanan]* untuk melihat status.\nContoh: *cek 11*";
      } else {
        try {
          const res = await fetch(`https://batikwistara.com/api/pesanan/${id}`);
          const order = await res.json();

          if (!order || order.status === "not_found") {
            reply = `❌ Maaf, pesanan dengan ID *${id}* tidak ditemukan.`;
          } else {
            reply = `🧾 *Status Pesanan Anda*\n\n🆔 *ID:* ${order.id}\n👤 *Nama:* ${order.nama}\n📞 *Telepon:* ${order.telepon}\n💰 *Total:* Rp${parseInt(order.total).toLocaleString("id-ID")}\n💳 *Pembayaran:* ${order.status_pembayaran}\n🚚 *Status:* ${order.status}\n📅 *Tanggal:* ${new Date(order.created_at).toLocaleDateString("id-ID")}\n💼 *Metode:* ${order.metode_pembayaran}\n\nTerima kasih telah berbelanja di *Batik Wistara*! 💛`;
          }
        } catch (err) {
          console.error("❌ Gagal mengambil data pesanan:", err);
          reply = "⚠️ Maaf, server sedang tidak dapat mengambil data pesanan.";
        }
      }
    }

    // === MENU ALAMAT ===
    else if (["3", "alamat", "lokasi"].includes(msg)) {
      reply = `📍 *Alamat Batik Wistara:*\nJl. Tambak Medokan Ayu VI C No.56B, Rungkut — Surabaya\n🕒 Buka: 08.00–17.00 WIB\n\n🗺️ https://maps.app.goo.gl/WqHPo5eNBDqHykhM8\n\nKetik *0* untuk chat admin.`;
    }

    // === MENU ADMIN ===
    else if (["0", "admin"].includes(msg)) {
      reply = `📞 Admin akan segera membalas anda.\nBot akan berhenti sementara.\nKetik *menu* untuk mengaktifkan kembali bot.`;
      activeSessions.set(sender, "pause");
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
4️⃣ *Cek Status Pesanan*
0️⃣ *Hubungi Admin*

💡 *Balas dengan angka (1–4 atau 0)* untuk memilih menu.`;
    }

    return reply;
  } catch (err) {
    console.error("❌ Error chatbot:", err);
    return "⚠️ Terjadi kesalahan pada server chatbot.";
  }
}

// ===============================
// 🌐 API UNTUK WEBSITE
// ===============================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const reply = await getBotReply("web", message);
  res.json({ reply });
});

// ===============================
// 💬 WEBHOOK UNTUK WHATSAPP (FONNTE)
// ===============================
app.post("/api/fonnte-webhook", async (req, res) => {
  try {
    const sender = req.body.sender;
    const message = req.body.message;

    if (!sender || !message) return res.sendStatus(200);

    const reply = await getBotReply(sender, message);

    if (reply) {
      await fetch("https://api.fonnte.com/send", {
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
    }

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
      <h2>✅ Wistara Chatbot Aktif (Web + WhatsApp)</h2>
      <p>🌐 API Website: <code>/api/chat</code></p>
      <p>💬 Webhook WhatsApp: <code>/api/fonnte-webhook</code></p>
    </body></html>
  `);
});

// ===============================
// 🚀 JALANKAN SERVER
// ===============================
app.listen(PORT, () => console.log(`🚀 Wistara Chatbot aktif di port ${PORT}`));
