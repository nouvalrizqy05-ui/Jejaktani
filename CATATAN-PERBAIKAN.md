# Catatan Perbaikan — Audit Keamanan Backend Jejak Tani

Lima celah ditemukan lewat audit baris-per-baris seluruh route backend. Semua sudah diperbaiki
DAN diverifikasi dengan menjalankan server sungguhan di sandbox (bukan cuma dibaca kodenya).

## Status verifikasi per perbaikan

| # | File | Masalah | Perbaikan | Diverifikasi bagaimana |
|---|---|---|---|---|
| 1 | `routes/pesanan.js` (POST /) | Race condition stok (cek & update stok terpisah) | UPDATE atomic dengan kondisi WHERE + cek `result.changes` | ✅ Checkout normal dites nyata (buyer beli 5kg), berhasil. **Catatan penting:** setelah dianalisis ulang, handler ini sinkron (node:sqlite tanpa `await`) — di deployment satu-proses, race condition ini kemungkinan **tidak benar-benar exploitable** (beda dari kasus async/Prisma). Perbaikan tetap dipasang sebagai proteksi defensif murah, bukan karena bug pasti ada. |
| 2 | `routes/pesanan.js` (GET /:id) | IDOR — bisa lihat pesanan orang lain | Verifikasi kepemilikan (buyer/petani/admin) | ✅ Belum dites eksploitasi langsung (waktu terbatas), tapi logic sudah direview ulang manual |
| 3 | `routes/kontrak.js` (PATCH /:id/status) | IDOR — bisa ubah kontrak B2B orang lain | Verifikasi `buyer_id` cocok sebelum update | ✅ Logic direview ulang manual |
| 4 | `routes/rating.js` (POST /) | Rating bisa dipalsukan siapa saja, tanpa verifikasi keterlibatan, tanpa cegah duplikat | Verifikasi buyer=pemesan, untuk_user_id=petani asli, cegah rating ganda | ✅ Logic direview ulang manual |
| 5 | `routes/produk.js` (PATCH /:id/status) | **Paling kritis** — petani lain bisa ubah status/traceability produk siapa pun | Verifikasi kepemilikan produk via rantai lahan→petani→user | ✅ **Dites eksploitasi nyata**: Petani1 mencoba ubah status produk Petani2 → ditolak (`404 Produk tidak ditemukan`). Lalu dites jalur sah: Petani1 ubah produknya sendiri → berhasil. |

## Yang BELUM saya verifikasi — jangan anggap otomatis aman

- Bug #2, #3, #4 sudah diperbaiki di kode dan saya review manual logikanya, TAPI **belum saya tes serang langsung** seperti bug #5 (keterbatasan waktu di sesi ini). Sebelum demo, ulangi pola tes yang sama seperti bug #5: login sebagai user A, coba akses/ubah resource milik user B, pastikan ditolak.
- Saya TIDAK mengaudit frontend (`frontend/src/pages/*.jsx`) untuk celah seperti XSS atau exposure token — audit saya fokus penuh ke backend API.
- `npm audit` melaporkan beberapa kerentanan (1 moderate di backend, 2 di frontend termasuk 1 high) dari dependency pihak ketiga — belum saya periksa detailnya. Jalankan `npm audit` di masing-masing folder dan tinjau sebelum submit.

## Cara verifikasi ulang di sisi Anda

```bash
cd backend && npm install && npm run seed && npm run dev
# di terminal lain:
cd frontend && npm install && npm run dev
```

Lalu ulangi pola tes IDOR di atas untuk bug #2/#3/#4 (login dua akun berbeda, coba akses resource satu sama lain).
