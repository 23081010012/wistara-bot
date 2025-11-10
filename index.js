// ===============================
// 🤖 WISTARA CHATBOT REST API
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
const ADMIN_WA = "6281234567890"; 

// ===============================
// 🧠 LOGIKA CHATBOT
// ===============================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
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
        reply = "<b>🛍️ Katalog Produk Terbaru:</b><br>";
        produkData.slice(0, 3).forEach((p) => {
          reply += `
            <div style='margin-top:10px; border-bottom:1px solid #eee; padding-bottom:10px;'>
              <img src='https://batikwistara.com/storage/${p.gambar}' 
                width='100' 
                style='border-radius:8px; margin-bottom:4px;'><br>
              <b>${p.nama_produk}</b><br>
              💰 Rp${parseInt(p.harga).toLocaleString("id-ID")}<br>
              <a href='${p.link_shopee || "#"}' target='_blank'>🛒 Beli di Shopee</a><br>
              ${p.link_tiktok ? `<a href='${p.link_tiktok}' target='_blank'>🎥 TikTok Shop</a>` : ""}
            </div>`;
        });

        quick_replies = [
          { label: "Lihat Semua Produk ➜", value: "https://batikwistara.com/katalog" },
          { label: "💬 Hubungi Admin", value: "admin" },
          { label: "🔙 Kembali ke Menu Utama", value: "menu" },
        ];
      }
    }

    // === Menu Berita ===
    else if (msg.includes("berita")) {
      const beritaRes = await fetch("https://batikwistara.com/api/berita");
      const beritaData = await beritaRes.json();

      if (!Array.isArray(beritaData) || beritaData.length === 0) {
        reply = "⚠️ Belum ada berita terbaru.";
      } else {
        reply = "<b>📰 Berita Terbaru:</b><br>";
        beritaData.slice(0, 3).forEach((b) => {
          reply += `• <a href="https://batikwistara.com/berita/${b.slug}" target="_blank">${b.judul}</a><br>`;
        });

        quick_replies = [
          { label: "Lihat Semua Berita ➜", value: "https://batikwistara.com/berita" },
          { label: "💬 Hubungi Admin", value: "admin" },
          { label: "🔙 Kembali ke Menu Utama", value: "menu" },
        ];
      }
    }

    // === Menu Alamat ===
    else if (msg.includes("alamat") || msg.includes("lokasi")) {
      reply = `
        📍 <b>Alamat Batik Wistara:</b><br>
        Jl. Ketintang No.88, Surabaya<br>
        🕒 Buka: 09.00–17.00 WIB<br><br>
        <a href="https://goo.gl/maps/smRxxWistara" target="_blank">🗺️ Lihat di Google Maps</a>
      `;
      quick_replies = [
        { label: "💬 Hubungi Admin", value: "admin" },
        { label: "🔙 Kembali ke Menu", value: "menu" },
      ];
    }

    // === Menu Hubungi Admin ===
    else if (msg.includes("admin") || msg === "0") {
      reply = `
        📞 Klik tombol di bawah untuk menghubungi admin kami via WhatsApp.<br>
        Kami siap membantu Anda 💛
      `;
      quick_replies = [
        { label: "💬 Chat Admin di WhatsApp", value: `https://wa.me/${ADMIN_WA}?text=Halo%20admin%2C%20saya%20mau%20bertanya.` },
        { label: "🔙 Kembali ke Menu", value: "menu" },
      ];
    }

    // === Menu Utama ===
    else {
      const hour = new Date().getHours();
      const greet =
        hour < 12 ? "Selamat pagi ☀️" : hour < 18 ? "Selamat siang 🌤️" : "Selamat malam 🌙";

      reply = `
        ${greet}! ✨<br>
        Selamat datang di <b>Batik Wistara</b>.<br>
        Silakan pilih layanan berikut 👇
      `;
      quick_replies = [
        { label: "🛍️ Katalog Produk", value: "produk" },
        { label: "📰 Berita Terbaru", value: "berita" },
        { label: "📍 Alamat & Jam Buka", value: "alamat" },
        { label: "💬 Hubungi Admin", value: "admin" },
      ];
    }

    res.json({ reply, quick_replies });
  } catch (err) {
    console.error("❌ Error chatbot:", err);
    res.json({
      reply: "⚠️ Maaf, terjadi kesalahan pada server chatbot.",
      quick_replies: [{ label: "🔁 Coba Lagi", value: "menu" }],
    });
  }
});

// ===============================
// ⚙️ ROUTE STATUS UNTUK CEK
// ===============================
app.get("/", (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif; text-align:center; padding-top:40px;">
      <h2>✅ Wistara Chatbot API aktif dan berjalan di server!</h2>
      <p>Gunakan endpoint: <code>/api/chat</code></p>
    </body></html>
  `);
});

// ===============================
// 🚀 JALANKAN SERVER
// ===============================
app.listen(PORT, () => console.log(`🚀 Chatbot Batik Wistara aktif di port ${PORT}`));
