import express from "express";
import { db } from "../config/db.js";
import { apiKey } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/katalog
 * -> daftar produk aktif
 */
router.get("/", apiKey, async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_produk, nama_produk, harga, gambar, link_shopee, link_tiktok FROM produk WHERE status='aktif' ORDER BY tanggal_upload DESC"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/katalog/:id_produk
 * -> detail 1 produk
 */
router.get("/:id_produk", apiKey, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_produk, nama_produk, deskripsi, harga, gambar, link_shopee, link_tiktok FROM produk WHERE id_produk = ? AND status='aktif'",
      [req.params.id_produk]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Produk tidak ditemukan" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
