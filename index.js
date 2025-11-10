// === BATIK WISTARA CHATBOT API (Production Simple Version) ===
import express from "express";
import cors from "cors";

const app = express();
app.use(cors()); // izinkan akses dari domain Laravel kamu
app.use(express.json());

// --- ROUTE CEK STATUS ---
app.get("/", (req, res) => {
  res.send("✅ Wistara Chatbot API aktif dan berjalan di server!");
});

// --- ROUTE UTAMA CHATBOT ---
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Pesan kosong, coba ketik sesuatu 😊" });
  }

  const text = message.toLowerCase();
  let reply = "Maaf, saya belum paham 😅. Coba ketik *halo*, *produk*, *harga*, atau *alamat*.";

  if (text.includes("halo") || text.includes("hai"))
    reply = "Halo 👋, selamat datang di Batik Wistara!";
  else if (text.includes("produk"))
    reply = "Kami menyediakan berbagai batik premium khas Nusantara 💙";
  else if (text.includes("harga"))
    reply = "Harga batik kami mulai dari Rp150.000 hingga Rp500.000 tergantung model dan bahan.";
  else if (text.includes("alamat"))
    reply = "Toko kami berlokasi di Surabaya, Jawa Timur 🏠";
  else if (text.includes("kontak"))
    reply = "Hubungi kami di WhatsApp 0812-xxxx-xxxx untuk pemesanan cepat 📱";

  res.json({ reply });
});

// --- JALANKAN SERVER ---
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Wistara Chatbot API berjalan di port ${port}`);
});
