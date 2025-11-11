// ===============================
// 🤖 WISTARA CHATBOT REST API (Web + WhatsApp Fonnte + Cek Pesanan)
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

// 🧠 Simpan status apakah user sedang ngobrol dengan admin
const activeSessions = new Map();

// ===============================
// 🧠 LOGIKA CHATBOT (Web + WhatsApp)
// ===============================
async function getBotReply(sender, message) {
  const msg = (message || "").toLowerCase().trim();
  console.log("💬 Pesan dari", sender, ":", msg);

  // Jika user sedang di mode admin, bot diam sampai user ketik "menu"
  if (activeSessions.get(sender) === "pause") {
    if (msg === "menu") {
      activeSessions.delete(sender);
      return "✨ *Chatbot diaktifkan kembali!*\nSilakan ketik angka 1–4 untuk memilih menu.";
    }
    return null;
  }

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

    // === CEK PESANAN (4 / cek / pesanan / id) ===
    else if (["4", "cek", "pesanan"].some(k => msg.includes(k))) {
      const id = msg.replace(/cek|pesanan/gi, "").trim();

      if (!id) {
        reply = "🔍 Silakan kirim *cek [ID pesanan]* untuk melihat status.\nContoh: *cek 11*";
      } else {
        try {
          const res = await fetch(`https://batikwistara.com/api/cek-pesanan/${id}`);
          const data = await res.json();

          if (data.status === "not_found") {
            reply = `❌ Maaf, pesanan dengan ID *${id}* tidak ditemukan.`;
          } else {
            const p = data.data;
            reply = `🧾 *Status Pesanan Anda*\n\n🆔 *ID:* ${p.id}\n👤 *Nama:* ${p.nama}\n📞 *Telepon:* ${p.telepon}\n💰 *Total:* Rp${p.total}\n💳 *Pembayaran:* ${p.status_pembayaran}\n🚚 *Status:* ${p.status_pesanan}\n📅 *Tanggal:* ${p.tanggal}\n💼 *Metode:* ${p.metode}\n\nTerima kasih telah berbelanja di *Batik Wistara*! 💛`;
          }
        } catch (err) {
          console.error("Error cek pesanan:", err);
          reply = "⚠️ Gagal mengambil data pesanan. Coba lagi nanti.";
        }
      }
    }

    // === HUBUNGI ADMIN (0 / admin) ===
    else if (["0", "admin"].includes(msg)) {
      reply = `📞 Admin akan segera membalas anda.\nBot akan berhenti sementara sampai Anda ketik *menu* untuk melanjutkan kembali.`;
      activeSessions.set(sender, "pause");
    }

    // === MENU UTAMA (default) ===
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
    return "⚠️ Maaf, terjadi kesalahan pada server chatbot.";
  }
}

// ===============================
// 🌐 CHATBOT UNTUK WEBSITE
// ===============================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const reply = await getBotReply("web", message);
  res.json({ reply });
});

// ===============================
// 💬 WEBHOOK UNTUK WHATSAPP FONNTE
// ===============================
app.post("/api/fonnte-webhook", async (req, res) => {
  try {
    const sender = req.body.sender;
    const message = req.body.message;

    if (!sender || !message) {
      console.warn("⚠️ Webhook tanpa data pengirim, diabaikan.");
      return res.sendStatus(200);
    }

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
