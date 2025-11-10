// =======================
// WISTARABOT v3 (Dynamic Products & News)
// =======================

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// === STATUS SERVER ===
app.get("/", (req, res) => {
  res.send("✅ WistaraBot v3 aktif dan berjalan dengan data dinamis (produk & berita)!");
});

// === ENDPOINT CHATBOT ===
app.post("/api/chat", async (req, res) => {
  const { message, state } = req.body;
  const response = await getBotReply(message, state);
  res.json(response);
});

app.get("/api/chat", (req, res) => {
  res.send("⚙️ Endpoint aktif — gunakan POST { message: '...' } untuk kirim pesan.");
});

// === LOGIKA UTAMA CHATBOT ===
async function getBotReply(text, state = "menu") {
  text = (text || "").toLowerCase().trim();

  // === MENU UTAMA ===
  if (text === "menu" || state === "menu") {
    return {
      reply: `
✨ *Selamat datang di Batik Wistara!* ✨

Silakan pilih layanan:
1️⃣ Katalog Produk  
2️⃣ Berita Terbaru  
3️⃣ Alamat & Jam Buka  
0️⃣ Hubungi Admin

Ketik angka atau pilih tombol di bawah 👇
      `,
      quick_replies: ["1", "2", "3", "0"],
      next_state: "menu"
    };
  }

  // === PRODUK DINAMIS ===
  if (text === "1" || text.includes("produk")) {
    try {
      const res = await fetch("https://batikwistara.com/api/produk");
      const data = await res.json();

      if (!data.length) {
        return { reply: "📦 Belum ada produk saat ini.", next_state: "menu" };
      }

      let reply = "🧵 *Katalog Produk Batik Wistara:*\n\n";
      data.forEach(p => {
        reply += `• ${p.nama_produk} — Rp${p.harga}\n`;
      });
      reply += "\nPilih produk di bawah ini 👇";

      const quickReplies = data.map(p => p.nama_produk);

      return { reply, quick_replies: quickReplies, next_state: "pilih_produk" };
    } catch (err) {
      console.error("❌ Error produk:", err);
      return { reply: "⚠️ Gagal memuat data produk dari server.", next_state: "menu" };
    }
  }

  // === PILIH PRODUK (STATE LANJUTAN) ===
  if (state === "pilih_produk") {
    const linkWA = `https://wa.me/6281234567890?text=Halo%20saya%20ingin%20memesan%20${encodeURIComponent(text)}`;
    return {
      reply: `Terima kasih! Untuk memesan *${text}*, silakan klik tautan berikut:\n👉 ${linkWA}\n\nKetik *menu* untuk kembali.`,
      next_state: "menu"
    };
  }

  // === BERITA DINAMIS ===
  if (text === "2" || text.includes("berita")) {
    try {
      const res = await fetch("https://batikwistara.com/api/berita");
      const data = await res.json();

      if (!data.length) {
        return { reply: "📰 Belum ada berita terbaru.", next_state: "menu" };
      }

      let reply = "📰 *Berita Terbaru Batik Wistara:*\n\n";
      data.forEach(b => {
        reply += `• ${b.judul} (${b.tanggal})\n`;
      });
      reply += "\nKlik salah satu berita di bawah 👇";

      const quickReplies = data.map(b => b.judul);

      return { reply, quick_replies: quickReplies, next_state: "pilih_berita" };
    } catch (err) {
      console.error("❌ Error berita:", err);
      return { reply: "⚠️ Gagal memuat berita dari server.", next_state: "menu" };
    }
  }

  // === PILIH BERITA (STATE LANJUTAN) ===
  if (state === "pilih_berita") {
    try {
      const res = await fetch("https://batikwistara.com/api/berita");
      const data = await res.json();
      const item = data.find(b => b.judul.toLowerCase().includes(text.toLowerCase()));

      if (item) {
        const link = item.slug ? `https://batikwistara.com/berita/${item.slug}` : "#";
        return {
          reply: `📰 *${item.judul}*\nTanggal: ${item.tanggal}\n\nBaca selengkapnya:\n👉 ${link}\n\nKetik *menu* untuk kembali.`,
          next_state: "menu"
        };
      } else {
        return { reply: "❌ Maaf, berita tersebut tidak ditemukan.", next_state: "menu" };
      }
    } catch (err) {
      return { reply: "⚠️ Gagal memuat detail berita.", next_state: "menu" };
    }
  }

  // === ALAMAT & JAM BUKA ===
  if (text === "3" || text.includes("alamat") || text.includes("buka")) {
    return {
      reply: `
📍 *Toko Batik Wistara*
Jl. Raya Jemursari No.123, Surabaya, Jawa Timur

🕐 *Jam Buka*
Setiap Hari: 09.00 - 21.00 WIB

Ketik *menu* untuk kembali.
      `,
      next_state: "menu"
    };
  }

  // === HUBUNGI ADMIN ===
  if (text === "0" || text.includes("admin") || text.includes("kontak")) {
    return {
      reply: `
📞 *Hubungi Admin Wistara:*
WhatsApp: https://wa.me/6281234567890
Instagram: @batikwistara

Ketik *menu* untuk kembali.
      `,
      next_state: "menu"
    };
  }

  // === DEFAULT ===
  return {
    reply: "🙏 Maaf, saya belum paham. Ketik *menu* untuk melihat daftar pilihan.",
    next_state: "menu"
  };
}

// === JALANKAN SERVER ===
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 WistaraBot v3 berjalan di port ${port}`));
