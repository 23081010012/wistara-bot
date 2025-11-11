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

// Ganti dengan nomor admin WhatsApp kamu (tanpa tanda +)
const ADMIN_WA = process.env.ADMIN_WA || "62895381110035";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN; // tambahkan di .env

// ===============================
// 🧠 LOGIKA CHATBOT GLOBAL
// ===============================
async function getBotReply(message) {
  const msg = (message || "").toLowerCase().trim();
  console.log("💬 Pesan diterima:", msg);

  let reply = "";
  let quick_replies = [];

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

    return { reply, quick_replies };
  } catch (err) {
    console.error("❌ Error chatbot:", err);
    return { reply: "⚠️ Maaf, terjadi kesalahan pada server chatbot." };
  }
}

// ===============================
// 🌐 API UNTUK WEBSITE
// ===============================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const response = await getBotReply(message);
  res.json(response);
});

// ===============================
// 🔁 WEBHOOK UNTUK FONNTE (WhatsApp)
// ===============================
app.post("/api/fonnte-webhook", async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.sendStatus(400);

    console.log("💬 Pesan dari WhatsApp:", phone, message);
    const { reply } = await getBotReply(message);
    await sendFonnteMessage(phone, reply);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error webhook:", err);
    res.sendStatus(500);
  }
});

// ===============================
// 💬 FUNGSI KIRIM PESAN VIA FONNTE
// ===============================
async function sendFonnteMessage(target, message) {
  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        message,
        delay: 1,
      }),
    });
    const data = await res.json();
    console.log("✅ Pesan terkirim via Fonnte:", data);
  } catch (err) {
    console.error("❌ Gagal kirim pesan via Fonnte:", err);
  }
}

// ===============================
// ⚙️ STATUS SERVER
// ===============================
app.get("/", (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif; text-align:center; padding-top:40px;">
      <h2>✅ Wistara Chatbot aktif (Web + WhatsApp via Fonnte)</h2>
      <p>Gunakan endpoint:</p>
      <ul style="list-style:none;">
        <li>🌐 <code>/api/chat</code> — untuk website</li>
        <li>💬 <code>/api/fonnte-webhook</code> — untuk WhatsApp</li>
      </ul>
    </body></html>
  `);
});

// ===============================
// 🚀 JALANKAN SERVER
// ===============================
app.listen(PORT, () => console.log(`🚀 Wistara Chatbot aktif di port ${PORT}`));
