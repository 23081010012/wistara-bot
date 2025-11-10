// =======================
// WISTARABOT v2 (Smart Chatbot API)
// =======================

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// =============== STATUS SERVER ===============
app.get("/", (req, res) => {
  res.send("✅ WistaraBot API v2 aktif dan berjalan dengan baik!");
});

// =============== ENDPOINT CHATBOT ===============
app.post("/api/chat", async (req, res) => {
  const { message, state } = req.body;
  const response = await getBotReply(message, state);
  res.json(response);
});

// Tambahkan route GET agar tidak error "Cannot GET /api/chat"
app.get("/api/chat", (req, res) => {
  res.send("⚙️ Endpoint chatbot aktif — gunakan POST dengan body JSON { message: '...' }");
});

// =============== LOGIKA CHATBOT ===============
async function getBotReply(text, state = "menu") {
  text = (text || "").toLowerCase().trim();

  // MENU UTAMA
  if (text === "menu" || state === "menu") {
    return {
      reply: `
✨ *Selamat datang di Batik Wistara!* ✨

Silakan pilih layanan:
1️⃣ Katalog Produk  
2️⃣ Cek Stok Produk  
3️⃣ Berita Terbaru  
4️⃣ Alamat & Jam Buka  
0️⃣ Hubungi Admin

Ketik angka atau pilih tombol di bawah 👇
      `,
      quick_replies: ["1", "2", "3", "4", "0"],
      next_state: "menu"
    };
  }

  // PRODUK
  if (text === "1" || text.includes("produk")) {
    try {
      const res = await fetch("https://batikwistara.com/api/produk");
      const data = await res.json();

      if (!data.length) {
        return { reply: "📦 Belum ada produk yang tersedia saat ini.", next_state: "menu" };
      }

      let reply = "🧵 *Katalog Produk Batik Wistara:*\n\n";
      data.forEach(p => {
        reply += `• ${p.nama_produk} — Rp${p.harga}\n`;
      });
      reply += "\nKetik *menu* untuk kembali ke daftar utama.";
      return { reply, next_state: "menu" };
    } catch (err) {
      return { reply: "⚠️ Gagal memuat data produk.", next_state: "menu" };
    }
  }

  // STOK PRODUK
  if (text === "2" || text.includes("stok")) {
    try {
      const res = await fetch("https://batikwistara.com/api/produk");
      const data = await res.json();

      let reply = "📦 *Cek Ketersediaan Stok Produk:*\n\n";
      data.forEach(p => {
        reply += `• ${p.nama_produk} → ${p.stok > 0 ? "✅ Ready" : "❌ Habis"}\n`;
      });
      reply += "\nKetik *menu* untuk kembali.";
      return { reply, next_state: "menu" };
    } catch (err) {
      return { reply: "⚠️ Gagal memuat data stok.", next_state: "menu" };
    }
  }

  // BERITA TERBARU
  if (text === "3" || text.includes("berita")) {
    try {
      const res = await fetch("https://batikwistara.com/api/berita");
      const data = await res.json();

      if (!data.length) {
        return { reply: "📰 Belum ada berita terbaru untuk saat ini.", next_state: "menu" };
      }

      let reply = "📰 *Berita Terbaru Batik Wistara:*\n\n";
      data.forEach(b => {
        reply += `• ${b.judul} (${b.tanggal})\n`;
      });
      reply += "\nKetik *menu* untuk kembali.";
      return { reply, next_state: "menu" };
    } catch (err) {
      return { reply: "⚠️ Gagal memuat data berita.", next_state: "menu" };
    }
  }

  // ALAMAT & JAM BUKA
  if (text === "4" || text.includes("alamat") || text.includes("buka")) {
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

  // HUBUNGI ADMIN
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

  // DEFAULT (fallback)
  return {
    reply: "🙏 Maaf, saya belum paham. Ketik *menu* untuk melihat daftar pilihan.",
    next_state: "menu"
  };
}

// =============== JALANKAN SERVER ===============
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 WistaraBot API v2 aktif di port ${port}`));

import fs from "fs";
const logStream = fs.createWriteStream("./app.log", { flags: "a" });
const origConsoleError = console.error;
console.error = (...args) => {
  logStream.write(args.join(" ") + "\n");
  origConsoleError.apply(console, args);
};
