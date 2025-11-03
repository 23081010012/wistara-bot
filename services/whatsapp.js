import * as baileys from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fetch from "node-fetch";

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
let sock;

export async function startWhatsApp() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState("./auth_wistara");

  sock = makeWASocket({
    version,
    auth: state,
    browser: ["Chrome (Windows)", "Chrome", "127.0.0.1"],
  });

  // 🔹 Kirim semua pesan masuk ke REST API (webhook)
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      "";

    console.log("📩 Pesan masuk dari:", jid, "| isi:", text);

    try {
      // Kirim ke webhook (Laravel atau backend lain)
      await fetch("http://localhost:3000/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: jid,
          text: text,
        }),
      });
    } catch (err) {
      console.error("❌ Gagal kirim ke webhook:", err.message);
    }
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr, pairingCode }) => {
    if (qr) {
      console.log("📱 Scan QR berikut untuk login WhatsApp:");
      qrcode.generate(qr, { small: true });
    } else if (pairingCode) {
      console.log("🔑 Pairing code:", pairingCode);
    }

    if (connection === "open") console.log("✅ WhatsApp Connected!");
    else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("⚠️ Koneksi terputus. Alasan:", reason);
      if (reason !== DisconnectReason.loggedOut) setTimeout(startWhatsApp, 5000);
    }
  });

  sock.ev.on("creds.update", saveCreds);
  return sock;
}

export function getSocket() {
  if (!sock) throw new Error("❌ WhatsApp belum terhubung.");
  return sock;
}
