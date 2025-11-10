import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// === Konfigurasi URL API Laravel ===
const produkAPI = "https://batikwistara.com/api/produk";
const beritaAPI = "https://batikwistara.com/api/berita";

// === Fungsi utama chatbot ===
app.post("/api/chat", async (req, res) => {
  const message = (req.body.message || "").toLowerCase().trim();
  let reply = "";
  let quick_replies = [];
  let next_state = "menu";

  try {
    // --- MENU UTAMA ---
    if (message === "menu" || message === "hai" || message === "halo" || message === "hi") {
      reply = `✨ <b>Selamat datang di Batik Wistara!</b> ✨<br>
      Silakan pilih layanan:<br><br>
      1️⃣ Katalog Produk<br>
      2️⃣ Berita Terbaru<br>
      3️⃣ Alamat & Jam Buka<br>
      0️⃣ Hubungi Admin<br><br>
      Ketik angka atau pilih tombol di bawah 👇`;
      quick_replies = [
        { label: "1️⃣ Katalog Produk", value: "1" },
        { label: "2️⃣ Berita Terbaru", value: "2" },
        { label: "3️⃣ Alamat & Jam Buka", value: "3" },
        { label: "0️⃣ Hubungi Admin", value: "0" }
      ];
    }

    // --- KATALOG PRODUK ---
    else if (message === "1") {
      const r = await fetch(produkAPI);
      const produk = await r.json();

      if (!produk.length) {
        reply = "😔 Belum ada produk yang tersedia saat ini.";
      } else {
        reply = "<b>🛍️ Katalog Produk Terbaru:</b><br><br>";
        produk.forEach(p => {
          reply += `
          <b>${p.nama_produk}</b><br>
          💰 Rp${parseInt(p.harga).toLocaleString("id-ID")}<br>
          📦 Stok: ${p.stok}<br>
          <img src="https://batikwistara.com/storage/${p.gambar}" width="220" style="border-radius:10px;margin:6px 0;"><br>
          ${p.link_shopee ? `<a href="${p.link_shopee}" target="_blank">🛒 Beli di Shopee</a><br>` : ""}
          ${p.link_tiktok ? `<a href="${p.link_tiktok}" target="_blank">🎥 Lihat di TikTok</a><br>` : ""}
          <hr style="border:0.5px solid #ccc;margin:8px 0;">
          `;
        });
      }

      quick_replies = [{ label: "🔙 Kembali ke Menu", value: "menu" }];
      next_state = "produk";
    }

    // --- BERITA TERBARU ---
    else if (message === "2") {
      const r = await fetch(beritaAPI);
      const berita = await r.json();

      if (!berita.length) {
        reply = "📭 Belum ada berita terbaru saat ini.";
      } else {
        reply = "<b>📰 Berita Terbaru Wistara:</b><br><br>";
        berita.forEach(b => {
          const tanggal = new Date(b.tanggal).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric"
          });
          reply += `
          🗓️ <b>${tanggal}</b><br>
          <b>${b.judul}</b><br>
          <a href="https://batikwistara.com/berita/${b.slug}" target="_blank">📖 Baca Selengkapnya</a><br><br>
          `;
        });
      }

      quick_replies = [{ label: "🔙 Kembali ke Menu", value: "menu" }];
      next_state = "berita";
    }

    // --- ALAMAT & JAM BUKA ---
    else if (message === "3") {
      reply = `
      🏠 <b>Alamat:</b><br>
      Jl. Ngagel Jaya Selatan No. 23, Surabaya<br><br>
      🕓 <b>Jam Buka:</b><br>
      Senin – Sabtu: 09.00 – 17.00<br>
      Minggu: Tutup<br><br>
      📞 Hubungi kami di <a href="https://wa.me/6281234567890" target="_blank">WhatsApp</a> untuk info lebih lanjut.
      `;
      quick_replies = [{ label: "🔙 Kembali ke Menu", value: "menu" }];
      next_state = "alamat";
    }

    // --- HUBUNGI ADMIN ---
    else if (message === "0") {
      reply = `
      💬 Ingin terhubung dengan admin?<br><br>
      Klik tombol di bawah ini:<br>
      <a href="https://wa.me/6281234567890?text=Halo%20Admin%20Batik%20Wistara!" target="_blank">📱 Chat WhatsApp Admin</a>
      `;
      quick_replies = [{ label: "🔙 Kembali ke Menu", value: "menu" }];
      next_state = "admin";
    }

    // --- DEFAULT / SALAH INPUT ---
    else {
      reply = `
      ✨ <b>Selamat datang di Batik Wistara!</b> ✨<br>
      Silakan pilih layanan:<br><br>
      1️⃣ Katalog Produk<br>
      2️⃣ Berita Terbaru<br>
      3️⃣ Alamat & Jam Buka<br>
      0️⃣ Hubungi Admin<br><br>
      Ketik angka atau pilih tombol di bawah 👇`;
      quick_replies = [
        { label: "1️⃣ Katalog Produk", value: "1" },
        { label: "2️⃣ Berita Terbaru", value: "2" },
        { label: "3️⃣ Alamat & Jam Buka", value: "3" },
        { label: "0️⃣ Hubungi Admin", value: "0" }
      ];
      next_state = "menu";
    }

    // --- Kirim respon JSON ---
    res.json({ reply, quick_replies, next_state });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      reply: "⚠️ Terjadi kesalahan di server chatbot.",
      quick_replies: [{ label: "🔙 Kembali ke Menu", value: "menu" }]
    });
  }
});

// === Jalankan server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Wistara Chatbot API aktif di port ${PORT}`));
