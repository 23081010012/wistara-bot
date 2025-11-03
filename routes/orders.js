import express from "express";
import { db } from "../config/db.js";
import { apiKey } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/orders/:id
 * -> detail status pesanan
 */
router.get("/:id", apiKey, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Pesanan tidak ditemukan" });

    const p = rows[0];
    const mapOrder = { pending: "Menunggu Konfirmasi", proses: "Sedang Diproses", selesai: "Selesai", batal: "Dibatalkan" };
    const mapBayar = { belum_bayar: "Belum Bayar", menunggu_verifikasi: "Menunggu Verifikasi", lunas: "Lunas", gagal: "Gagal" };

    res.json({
      id: p.id,
      nama: p.nama,
      telepon: p.telepon,
      alamat: p.alamat,
      total: Number(p.total),
      status: mapOrder[p.status] || p.status,
      status_pembayaran: mapBayar[p.status_pembayaran] || p.status_pembayaran,
      tipe_order: p.tipe_order,
      metode_pembayaran: p.metode_pembayaran,
      tanggal_ambil: p.tanggal_ambil,
      ambil: p.ambil,
      kirim: p.kirim,
      updated_at: p.updated_at
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
