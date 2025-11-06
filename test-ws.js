import WebSocket from "ws";

const url = "wss://web.whatsapp.com/ws/chat"; // contoh WebSocket server WhatsApp

console.log("🔍 Menguji koneksi WebSocket keluar...");

try {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("✅ WebSocket CONNECTED — Hosting MENDUKUNG koneksi keluar!");
    ws.close();
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket gagal:", err.message);
  });

} catch (err) {
  console.error("❌ Error inisialisasi:", err.message);
}
