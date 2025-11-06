// ==============================
// 💬 BATIK WISTARA CHATBOT (LOCAL)
// ==============================
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { startWhatsApp } = require("./services/whatsapp.js"); // pastikan sudah ada
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------
// 🔹 Koneksi Database Lokal (XAMPP)
// -----------------------------------
let db;
async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root", // default user XAMPP
      password: "", // kosong jika belum diatur
      database: "wistaralaravel", // ganti sesuai nama database kamu
    });
    console.log("✅ Database terhubung");
  } catch (err) {
    console.error("❌ Gagal koneksi DB:", err.message);
    setTimeout(connectDB, 5000); // auto retry setiap 5 detik
  }
}
connectDB();

// -----------------------------------
// 🔹 Endpoint Dasar
// -----------------------------------
app.get("/", (req, res) => {
  res.send("✅ Bot Batik Wistara aktif di server lokal Node.js");
});

// -----------------------------------
// 🔹 API: Daftar Produk
// -----------------------------------
app.get("/api/produk", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ success: false, error: "Database belum siap" });

    const [rows] = await db.query(
      "SELECT id_produk, nama_produk, harga, stok FROM produk WHERE status='aktif' ORDER BY tanggal_upload DESC LIMIT 10"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------
// 🔹 API: Cek Status Pesanan
// -----------------------------------
app.get("/api/order/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ success: false, error: "Database belum siap" });

    const [rows] = await db.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    const p = rows[0];
    res.json({
      success: true,
      data: {
        id: p.id,
        nama: p.nama,
        total: Number(p.total),
        status: p.status,
        status_pembayaran: p.status_pembayaran,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------
// 🔹 Jalankan Server
// -----------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});

// -----------------------------------
// 🔹 Jalankan WhatsApp Bot
// -----------------------------------
startWhatsApp();
