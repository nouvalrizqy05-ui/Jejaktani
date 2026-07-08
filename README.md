# Jejak Tani — Full-Stack Web App (Blueprint Subtema 3)

> "Setiap Panen Punya Jejak, Setiap Petani Punya Harga Adil"

Implementasi full-stack yang berfungsi (working MVP) dari blueprint **Jejak Tani**: platform
Rural Commerce & Supply Chain yang menghubungkan petani/UMKM pelosok langsung ke pembeli B2B/B2C,
dengan fitur traceability QR sebagai pembeda utama.

Proyek ini dibangun senyata dan sefungsional mungkin dalam batas yang bisa dikerjakan otomatis
(tanpa akun pihak ketiga berbayar, tanpa server produksi). Semua yang membutuhkan kredensial,
akun eksternal, atau keputusan bisnis manusia didaftar lengkap di **`PRODUCTION_CHECKLIST.md`**.

## Tech Stack

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router | Cepat, modern, mudah di-deploy statis |
| Backend | Node.js + Express | Ringan, REST API standar |
| Database | SQLite via `node:sqlite` (bawaan Node.js 22+) | Tanpa perlu instalasi server DB terpisah untuk development/demo |
| Auth | JWT (JSON Web Token) + bcrypt | Stateless, sederhana untuk MVP |
| QR / Traceability | `qrcode` (npm) | Generate QR asli & scannable per produk |

## Struktur Folder

```
jejak-tani/
  backend/
    src/
      db.js          # skema database (persis mengikuti ERD blueprint)
      seed.js         # data demo (4 petani, 2 buyer, 4 produk, dst.)
      index.js         # entry point Express
      middleware/auth.js
      routes/           # auth, produk, trace, pesanan, kontrak, harga, rating, petani, admin
    data/               # SQLite db + QR code hasil generate (dibuat otomatis)
  frontend/
    src/
      pages/            # Home, ProductDetail, TracePublic, Cart, Login, Register,
                         # PetaniDashboard, Akun (buyer), AdminDashboard, HargaReferensi, JadiMitra
      components/       # Navbar, Footer, ProductCard, TraceTimeline, TrustStars, Logo, dll.
      context/          # AuthContext, CartContext
  README.md             # (berkas ini)
  PRODUCTION_CHECKLIST.md
```

## Menjalankan Secara Lokal

**Prasyarat:** Node.js **versi 22.5 atau lebih baru** (dibutuhkan untuk modul `node:sqlite` bawaan).
Cek dengan `node -v`. Jika versi Node Anda lebih lama, lihat opsi migrasi database di
`PRODUCTION_CHECKLIST.md` bagian 1.

### 1. Backend

```bash
cd backend
cp .env.example .env      # lalu sesuaikan JWT_SECRET jika perlu
npm install
npm run seed               # isi database dengan data demo (boleh diulang kapan saja untuk reset)
npm run dev                 # jalan di http://localhost:4000
```

### 2. Frontend (di terminal terpisah)

```bash
cd frontend
npm install
npm run dev                 # jalan di http://localhost:5173
```

Buka **http://localhost:5173** di browser. Permintaan ke `/api/*` dan `/qrcodes/*` otomatis
diteruskan (proxy) ke backend melalui konfigurasi di `vite.config.js`.

## Akun Demo

| Peran | Email | Kata Sandi |
|---|---|---|
| Petani | `petani1@jejaktani.id` (juga ada petani2-4) | `petani123` |
| Buyer B2C | `buyer.rumahtangga@jejaktani.id` | `buyer123` |
| Buyer B2B | `buyer.resto@jejaktani.id` | `buyer123` |
| Admin | `admin@jejaktani.id` | `admin123` |

## Fitur yang Sudah Berfungsi Nyata

- ✅ Registrasi & login (petani / buyer B2C / buyer B2B), JWT auth, role-based access
- ✅ Marketplace: listing, pencarian, filter kategori, detail produk
- ✅ **Traceability QR** — QR code asli digenerate per produk, halaman publik `/trace/:id` bisa
  dibuka siapa saja (simulasikan hasil scan), menampilkan riwayat panen → grading → gudang → dipasarkan
- ✅ Keranjang belanja multi-item + checkout (dengan simulasi pembayaran, lihat catatan di bawah)
- ✅ Dashboard petani: catat hasil panen baru (otomatis generate QR + entri traceability pertama),
  update status/tahapan produk
- ✅ Dashboard buyer: riwayat pesanan, beri rating & ulasan untuk pesanan selesai
- ✅ Kontrak B2B berulang (volume, frekuensi, harga terkunci, termin pembayaran)
- ✅ Dashboard admin: ringkasan platform, monitoring pesanan, gudang, armada, daftar petani
- ✅ Halaman harga referensi pasar (transparansi harga)
- ✅ Skor trust/reputasi otomatis dari rating

## Yang Masih Disimulasikan (Perlu Integrasi Nyata Sebelum Produksi)

Ini bukan kekurangan kode — ini murni karena membutuhkan akun/kredensial pihak ketiga yang
hanya bisa didaftarkan oleh Anda sebagai pemilik bisnis. Detail lengkap dan langkah-langkahnya
ada di `PRODUCTION_CHECKLIST.md`.

| Fitur | Status di proyek ini | Yang dibutuhkan untuk production |
|---|---|---|
| Pembayaran | Simulasi (`status` langsung jadi `dibayar`) | Payment gateway (Midtrans/Xendit) |
| Harga referensi pasar | Data seed statis | Integrasi API Panel Harga Pangan Nasional / PIHPS BI |
| Kanal WhatsApp/SMS | Belum diimplementasi | WhatsApp Business API / Twilio |
| Optimasi rute armada | Pencatatan status manual | Google Maps Directions/Routing API |
| Grading otomatis AI | Input manual oleh petani/admin | Model computer vision (custom atau layanan pihak ketiga) |
| Verifikasi NIK/KYC | Field teks bebas | Integrasi API Dukcapil (butuh kerja sama resmi) |

## Kepatuhan Subtema 3

Tidak ada satu baris kode pun yang mengimplementasikan pinjaman, crowdfunding, dompet digital,
atau produk keuangan lain. Seluruh fitur murni marketplace + rantai pasok, sesuai Bagian 13
dokumen blueprint (`Blueprint_JejakTani_Subtema3.pdf`).
