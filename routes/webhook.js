import express from "express";
import { db } from "../config/db.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { from, text } = req.body;
  console.log("📥 Pesan masuk dari:", from, "| isi:", text);

  let reply = "";

  // === 1️⃣ MENU UTAMA ===
  if (/halo/i.test(text)) {
    reply = `👋 *Selamat datang di Batik Wistara!*\n
Silakan pilih menu:
1️⃣ Katalog Produk
2️⃣ Jam Operasional
3️⃣ Lokasi Toko
4️⃣ Cek Pesanan (contoh: cek pesanan 12)
5️⃣ Hubungi Admin`;
  }

  // === 2️⃣ KATALOG PRODUK (ambil dari DB) ===
  else if (text.trim() === "1") {
    const [rows] = await db.query(
      "SELECT nama_produk, harga, gambar, link_shopee, link_tiktok FROM produk WHERE status='aktif' ORDER BY tanggal_upload DESC LIMIT 5"
    );

    if (rows.length === 0) {
      reply = "📦 Belum ada produk aktif di katalog.";
    } else {
      reply = "🧵 *Katalog Produk Batik Wistara:*\n\n";
      for (const p of rows) {
        reply += `👗 *${p.nama_produk}*\n💰 Rp${Number(p.harga).toLocaleString("id-ID")}\n`;
        if (p.link_shopee) reply += `🛍️ Shopee: ${p.link_shopee}\n`;
        if (p.link_tiktok) reply += `🎥 TikTok: ${p.link_tiktok}\n`;
        reply += "\n";
      }
      reply += "Ketik *halo* untuk kembali ke menu utama.";
    }
  }

  // === 3️⃣ JAM OPERASIONAL ===
  else if (text.trim() === "2") {
    reply = "🕒 Kami buka Senin–Sabtu pukul 08.00–17.00 WIB. Minggu tutup.";
  }

  // === 4️⃣ LOKASI TOKO ===
  else if (text.trim() === "3") {
    reply = "📍 Toko Batik Wistara: Surabaya, Jawa Timur.\nGoogle Maps: https://maps.app.goo.gl/xxxxx";
  }

  else if (text.trim() === "4") {
  reply =
    "📦 Untuk melihat status pesanan ketik: *cek pesanan [ID]*\n" +
    "Misalnya : cek pesanan 5" +
    "Ketik *halo* untuk kembali ke menu utama.";
    }

  // === 5️⃣ CEK PESANAN ===
  else if (/cek pesanan/i.test(text)) {
    const match = text.match(/\d+/);
    if (!match) {
      reply = "⚠️ Format salah. Contoh: *cek pesanan 15*";
    } else {
      const orderId = match[0];
      const [rows] = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
      if (rows.length === 0) {
        reply = `❌ Pesanan dengan ID *${orderId}* tidak ditemukan.`;
      } else {
        const p = rows[0];
        const statusOrder = {
          pending: "⏳ Menunggu Konfirmasi",
          proses: "🧵 Sedang Diproses",
          selesai: "✅ Selesai",
          batal: "❌ Dibatalkan",
        }[p.status] || "📦 Tidak Diketahui";

        const statusBayar = {
          belum_bayar: "❌ Belum Bayar",
          menunggu_verifikasi: "⏳ Menunggu Verifikasi",
          lunas: "✅ Lunas",
          gagal: "⚠️ Gagal",
        }[p.status_pembayaran] || "❓";

        reply =
          `🧾 *Status Pesanan #${p.id}*\n\n` +
          `👤 *Nama:* ${p.nama}\n📞 *Telepon:* ${p.telepon}\n🏠 *Alamat:* ${p.alamat}\n\n` +
          `💰 *Total:* Rp${Number(p.total).toLocaleString("id-ID")}\n` +
          `💳 *Metode:* ${p.metode_pembayaran.toUpperCase()}\n` +
          `📦 *Tipe Order:* ${p.tipe_order.toUpperCase()}\n\n` +
          `🪄 *Status Pesanan:* ${statusOrder}\n` +
          `💸 *Status Pembayaran:* ${statusBayar}\n\n` +
          (p.status === "selesai"
            ? "🎉 Terima kasih sudah berbelanja di *Batik Wistara!* ❤️"
            : "Kami akan terus mengabari status pesanan Anda.") +
          "\n\nKetik *halo* untuk kembali ke menu utama.";
      }
    }
  }

  // === 6️⃣ HUBUNGI ADMIN ===
  else if (text.trim() === "5" || /admin/i.test(text)) {
    reply = "📞 Silakan chat langsung dengan admin. Kami akan segera merespons 🙏";
  }

  // === DEFAULT ===
  else {
    reply = "❓ Maaf, perintah tidak dikenali.\nKetik *halo* untuk melihat menu utama.";
  }

  // kirim balasan lewat REST API internal
  await fetch("http://localhost:3000/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: from.replace("@s.whatsapp.net", ""),
      message: reply,
    }),
  });

  res.json({ success: true });
});

export default router;
