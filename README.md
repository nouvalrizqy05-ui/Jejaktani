# Jejak Tani — Full-Stack Web App (Blueprint Subtema 3)

> "Setiap Panen Punya Jejak, Setiap Petani Punya Harga Adil"

Implementasi full-stack yang berfungsi (working MVP) dari blueprint **Jejak Tani**: platform Rural Commerce & Supply Chain yang menghubungkan petani/UMKM pelosok langsung ke pembeli B2B/B2C, dengan fitur traceability QR sebagai pembeda utama.

Proyek ini dibangun senyata dan sefungsional mungkin sebagai solusi inovatif dalam WebDev Competition. Semua integrasi kunci seperti Traceability, Payment Gateway Sandbox, dan State Management Frontend telah diimplementasikan secara komprehensif.

## 🚀 Tech Stack Utama

| Lapisan | Teknologi | Deskripsi / Alasan |
|---|---|---|
| **Frontend** | React 18 + Vite | SPA yang sangat responsif, cepat, dan modern. |
| **Styling** | Tailwind CSS | Utility-first CSS untuk desain UI yang konsisten, modern, dan mobile-first. |
| **State Mgt** | React Context API | Manajemen Global State tanpa overhead (Auth, Cart, Toast, Favorite). |
| **Backend** | Node.js + Express | Arsitektur backend REST API yang ringan dan terstandarisasi. |
| **Database** | SQLite (`node:sqlite`) | Database bawaan Node.js 22.5+, tanpa setup instalasi eksternal. Sempurna untuk demo & MVP. |
| **Auth** | JWT + bcrypt | Sistem autentikasi stateless yang aman berbasis token. |
| **Payments** | Midtrans API (Sandbox) | Simulasi checkout nyata melalui integrasi Midtrans Snap & Core API. |
| **Logistics** | Ekspedisi Dummy Data | Kalkulasi ongkir otomatis berbasis berat (kg) & jenis kurir (Same Day, Reguler, dll). |

## 🏗️ Struktur Folder

```text
jejak-tani/
├── backend/
│   ├── data/               # SQLite db (jejaktani.db) + QR code hasil generate otomatis
│   ├── scripts/            # Skrip utilisasi Python & Node (Crawl PIHPS, Kaggle dataset exploration)
│   ├── src/
│   │   ├── middleware/     # Auth JWT verifiers
│   │   ├── routes/         # Endpoint API (auth, produk, trace, pesanan, admin, dll.)
│   │   ├── db.js           # Skema database (persis mengikuti ERD blueprint)
│   │   ├── seed.js         # Data dummy interaktif (Petani, Buyer, 50+ Produk & Gambar Valid)
│   │   └── index.js        # Entry point server Express
│   ├── fix_images_robust.cjs # Script auto-fetch Wikipedia Image API (High Res fallback)
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # UI Murni (Navbar, Footer, ProductCard, TraceTimeline, dll.)
│   │   ├── context/        # AuthContext, CartContext, FavoriteContext, ToastContext
│   │   ├── pages/          # View Pages (Home, Cart, Favorit, Login, TracePublic, Dashboards)
│   │   ├── App.jsx         # Routing Manager & Global UI Wrapper (termasuk ScrollToTop)
│   │   ├── index.css       # File eksekusi CSS Utama & Tailwind directives
│   │   └── main.jsx        # Entry point React
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── PRODUCTION_CHECKLIST.md # Rekomendasi sebelum deployment
├── README.md               # Dokumentasi Proyek
└── docker-compose.yml      # Orkestrasi layanan kontainer (opsional)
```

## 💻 Menjalankan Secara Lokal

**Prasyarat:** Node.js **versi 22.5 atau lebih baru** (dibutuhkan untuk modul `node:sqlite` bawaan).
Cek dengan perintah `node -v`.

### 1. Backend

```bash
cd backend
cp .env.example .env      # Sesuaikan JWT_SECRET atau kunci Midtrans jika ada
npm install

# (Opsional) Inisialisasi/Reset Database ke Kondisi Semula dengan Produk Gambar Asli:
node fix_images_robust.cjs 
node src/seed.js

npm run dev               # Menjalankan server backend di http://localhost:4000
```

### 2. Frontend (di terminal terpisah)

```bash
cd frontend
npm install
npm run dev               # Menjalankan Vite frontend di http://localhost:5173
```

Buka **http://localhost:5173** di browser. Semua request API ke `/api/*` dan aset gambar `/qrcodes/*` secara otomatis diteruskan (proxy) ke backend melalui konfigurasi di `vite.config.js`.

## 👤 Akun Demo (Sudah disediakan dalam Seed)

| Peran | Email Login | Kata Sandi |
|---|---|---|
| **Petani** | `petani1@jejaktani.id` (hingga petani4) | `petani123` |
| **Buyer B2C** | `buyer.rumahtangga@jejaktani.id` | `buyer123` |
| **Buyer B2B** | `buyer.resto@jejaktani.id` | `buyer123` |
| **Admin** | `admin@jejaktani.id` | `admin123` |

## ✨ Fitur-Fitur Unggulan yang Berfungsi Nyata

### Sisi Pengguna (UI/UX)
- ✅ **Desain Responsif & Modern:** Menggunakan TailwindCSS dengan palet warna khusus (`earth`, `harvest`, `teal`), mendukung *Mobile-first approach*.
- ✅ **Navigasi Mulus:** Implementasi `ScrollToTop` yang mengatasi isu scroll tertinggal khas SPA, memastikan transisi antarmuka terasa alami.
- ✅ **Sistem Notifikasi Interaktif:** Ikon lonceng lengkap dengan badge merah untuk pesan masuk yang belum dibaca (*unread count*), serta fitur "Tandai Dibaca".
- ✅ **Favorit Global (Wishlist):** Sistem Context + LocalStorage yang membuat produk favorit ("Love") pengguna tidak hilang saat direfresh.
- ✅ **Keranjang Belanja Profesional:** Desain baru yang elegan layaknya e-commerce besar, dengan kalkulasi ongkir dan konversi harga yang presisi.

### Sisi Sistem Utama (Core Business)
- ✅ **Marketplace Hasil Tani:** Listing lebih dari 50 komoditas nyata lengkap dengan gambar resolusi tinggi, di-fetch dari API Wikimedia secara aman. Filter kategori otomatis.
- ✅ **Traceability QR Asli:** Setiap produk menghasilkan QR Code nyata. Saat discan / diinput ID-nya, akan membuka `/trace/:id` publik berisi riwayat kronologis produk (Masa Panen → Sortir/Grading → Gudang → Distribusi).
- ✅ **Integrasi Midtrans (Sandbox):** Transaksi checkout didukung dengan simulasi pembayaran nyata Midtrans Snap, mengubah status pembayaran otomatis berdasarkan balasan gerbang pembayaran (Payment Gateway).
- ✅ **Kontrak Berlangganan B2B:** Fitur khusus buyer B2B (restoran/hotel) untuk mengatur frekuensi pengiriman otomatis (harian/mingguan).
- ✅ **Dashboard Petani (Seller):** Petani bisa mencatat hasil panen baru (yang men-trigger QR code baru) dan mengubah status (*Trace Update*).
- ✅ **Dashboard Admin:** Menampilkan *insight* monitoring pesanan, ringkasan transaksi, serta manajemen *Cold Chain* (Rantai Dingin).
- ✅ **Harga Referensi PIHPS:** Tabulasi transparansi data harga pangan nasional (disimulasi statis) untuk menjaga stabilitas harga platform.

## 🤝 Kepatuhan Subtema 3

Aplikasi ini sangat patuh pada visi "Rural Commerce & Supply Chain". **Tidak ada satu baris kode pun** yang mengimplementasikan skema Peer-to-Peer Lending (pinjaman), dompet digital/e-money, asuransi, atau *crowdfunding*. Kami murni fokus pada sistem jual-beli adil (Marketplace) dan Rantai Pasok Terlacak (Traceability) sesuai *Blueprint JejakTani*.
