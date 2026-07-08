# Checklist Menuju Production-Ready — Jejak Tani

Dokumen ini adalah kelanjutan langsung dari `Blueprint_JejakTani_Subtema3.pdf`. Kode yang sudah
dibangun (lihat `README.md`) mengimplementasikan seluruh alur inti secara fungsional dengan data
simulasi. Untuk menjadikannya produk produksi sungguhan yang 100% sesuai blueprint, langkah-langkah
di bawah ini **membutuhkan tindakan manual** — akun pihak ketiga, keputusan bisnis, biaya, atau
badan hukum — yang tidak bisa diselesaikan secara otomatis.

Checklist disusun berurutan berdasarkan prioritas eksekusi.

---

## Fase 0 — Sebelum Mulai (Keputusan Bisnis)

- [ ] Tentukan badan hukum (PT/CV/Koperasi) jika akan beroperasi sungguhan — diperlukan untuk
      buka rekening bisnis, NPWP badan usaha, dan kerja sama dengan mitra ekspedisi/sertifikasi.
- [ ] Tentukan wilayah & komoditas pilot pertama (sesuai roadmap MVP di blueprint — jangan
      langsung nasional/multi-komoditas).
- [ ] Siapkan anggaran untuk: hosting, domain, API pihak ketiga, dan tim operasional lapangan
      (agen desa) — ini di luar cakupan kode.

## Fase 1 — Infrastruktur & Database Produksi

- [ ] **Migrasi database** dari SQLite (`node:sqlite`, cocok untuk demo/single-server) ke
      **PostgreSQL** atau **MySQL** yang mendukung concurrent write lebih baik untuk trafik nyata.
      Skema di `backend/src/db.js` sudah mengikuti ERD blueprint sehingga bisa diterjemahkan
      langsung (mis. dengan Prisma atau Drizzle ORM).
- [ ] Pilih hosting backend: Railway, Render, Fly.io, atau VPS (DigitalOcean/AWS EC2).
- [ ] Pilih hosting frontend: Vercel, Netlify, atau Cloudflare Pages (build `frontend/` dengan
      `npm run build`, deploy folder `dist/`).
- [ ] Daftarkan **nama domain** (mis. `jejaktani.id`) — sesuaikan juga variabel QR code di
      `backend/src/routes/produk.js` dan `seed.js` yang saat ini masih hardcode `jejaktani.id`.
- [ ] Aktifkan **SSL/TLS** (otomatis di Vercel/Netlify/Railway, atau via Let's Encrypt/Cloudflare
      jika pakai VPS sendiri).
- [ ] Setup **environment variables** produksi: `JWT_SECRET` (string acak panjang & rahasia,
      JANGAN pakai nilai default di `.env.example`), `DATABASE_URL`, dll.
- [ ] Setup **CI/CD** (GitHub Actions) agar setiap push ke `main` otomatis build & deploy.
- [ ] Setup backup database otomatis (harian minimum).

## Fase 2 — Keamanan

- [ ] Tambahkan **rate limiting** (`express-rate-limit`) terutama di endpoint login/register
      untuk mencegah brute-force.
- [ ] Tambahkan **Helmet.js** untuk HTTP security headers.
- [ ] Perketat **validasi input** di semua route backend (gunakan `zod` atau `joi`) — saat ini
      validasi masih dasar (cek field kosong saja).
- [ ] Batasi **CORS** hanya ke domain frontend produksi (saat ini `cors()` masih mengizinkan semua origin).
- [ ] Tambahkan **verifikasi email** saat registrasi (kirim link/kode konfirmasi).
- [ ] Tambahkan **verifikasi OTP nomor HP** — penting karena banyak petani mendaftar lewat kanal
      non-smartphone/WhatsApp.
- [ ] Audit dependency: jalankan `npm audit` secara berkala di kedua folder.
- [ ] Terapkan kebijakan kata sandi minimum (panjang, kombinasi karakter).

## Fase 3 — Integrasi Pihak Ketiga (Butuh Akun/API Key Manual)

Ini bagian paling signifikan — semuanya memerlukan Anda mendaftar akun bisnis di layanan terkait.

- [ ] **Payment gateway** — daftar akun **Midtrans** atau **Xendit**, dapatkan API key, ganti
      logika simulasi di `backend/src/routes/pesanan.js` (`PATCH /:id/bayar`) dengan pemanggilan
      API gateway sungguhan + webhook konfirmasi pembayaran.
- [ ] **WhatsApp Business API** (via Meta langsung atau provider seperti Twilio/Qontak) — untuk
      kanal onboarding non-smartphone dan notifikasi transaksi sesuai blueprint Bagian 3.1.
- [ ] **SMS gateway** (Twilio/Vonage) — untuk OTP dan notifikasi ke petani tanpa WhatsApp.
- [ ] **Data harga referensi pasar sungguhan** — ajukan akses/kerja sama data ke Panel Harga
      Pangan Nasional (Badan Pangan Nasional) atau PIHPS Bank Indonesia, lalu ganti data seed di
      `backend/src/seed.js` (tabel `harga_referensi`) dengan job terjadwal (cron) yang menarik
      data terbaru secara berkala.
- [ ] **Google Maps Platform** (Directions/Distance Matrix API) — untuk optimasi rute pengiriman
      armada sungguhan, menggantikan pencatatan status manual saat ini.
- [ ] **Object storage** (Cloudinary/AWS S3/Supabase Storage) — untuk upload foto produk asli
      dari petani, menggantikan emoji placeholder yang dipakai di demo ini.
- [ ] **Email transaksional** (Resend/SendGrid) — untuk notifikasi pesanan, konfirmasi akun, dsb.
- [ ] **Error tracking & monitoring** (Sentry) + **uptime monitoring** (UptimeRobot/BetterStack).
- [ ] **Analytics** (Plausible/Google Analytics 4) untuk memahami perilaku pengguna.

## Fase 4 — Fitur Lanjutan Sesuai Blueprint (Belum Diimplementasikan di MVP Ini)

- [ ] **Grading otomatis berbasis foto/AI** (Bagian 4.1 blueprint) — mulai dari model computer
      vision sederhana atau kerja sama dengan layanan pihak ketiga; saat ini grade diinput manual.
- [ ] **Sertifikasi digital** (organik/GAP) — perlu kerja sama resmi dengan lembaga sertifikasi
      yang disebut di Bagian 3.3 blueprint (mis. lembaga sertifikasi organik terakreditasi KAN).
- [ ] **Prediksi harga musiman** — fase lanjut sesuai roadmap Growth/Scale di blueprint.
- [ ] **Agregasi titik desa** dengan penjadwalan pickup — saat ini gudang & armada baru berupa
      data referensi, belum ada sistem penjadwalan otomatis.
- [ ] **Verifikasi NIK/KYC** ke Dukcapil — memerlukan kerja sama resmi dengan Kemendagri/pihak
      ketiga yang punya akses API kependudukan.

## Fase 5 — Legal & Kepatuhan

- [ ] Susun **Syarat & Ketentuan** dan **Kebijakan Privasi**, terutama terkait pengumpulan data
      pribadi petani (NIK, lokasi lahan) — wajib sesuai **UU PDP (UU No. 27/2022)**.
- [ ] Pastikan **consent management** eksplisit saat petani mendaftar (persetujuan penggunaan data).
- [ ] Tinjau kembali seluruh fitur secara berkala agar **tetap murni Subtema 3** — jangan
      menambahkan fitur pinjaman/investasi di kemudian hari tanpa meninjau ulang batasan lomba
      (lihat Bagian 13 blueprint).
- [ ] Jika bekerja sama dengan mitra ritel/ekspor/pemerintah (Bagian 3.3 blueprint), siapkan
      perjanjian kerja sama (MoU) tertulis.

## Fase 6 — Testing & Quality Assurance

- [ ] Tambahkan **automated testing** (Vitest/Jest untuk backend, React Testing Library untuk
      frontend) — proyek ini belum menyertakan test suite otomatis.
- [ ] **Load testing** (k6/Artillery) sebelum peluncuran untuk memastikan backend tahan trafik.
- [ ] Uji **aksesibilitas (a11y)** — kontras warna, navigasi keyboard, screen reader.
- [ ] Uji lintas perangkat, **khususnya HP kelas bawah dengan koneksi lambat** — mengingat target
      pengguna petani pelosok (selaras dengan prinsip desain "rural-first" di blueprint).
- [ ] **User acceptance testing** langsung bersama beberapa petani dan buyer sungguhan sebelum
      rilis penuh — sesuai semangat pilot bertahap di roadmap blueprint.

## Fase 7 — Operasional (Non-Teknis)

- [ ] Rekrut & latih **agen lapangan** sesuai alur onboarding di blueprint Bagian 5.4.
- [ ] Siapkan **SOP tim admin/ops** untuk resolusi sengketa, verifikasi akun, dan monitoring QC.
- [ ] Siapkan **gudang agregasi fisik** dan **armada** sungguhan (bukan cuma data di database) —
      ini investasi operasional di luar cakupan pengembangan software.
- [ ] Rancang program edukasi digital untuk petani (video singkat, bahasa daerah) sesuai
      Bagian 4.6 blueprint.

---

## Ringkasan Prioritas Jika Waktu/Sumber Daya Terbatas

Jika ini untuk keperluan **demo lomba**, kode yang sudah ada di proyek ini **sudah cukup** — tidak
perlu menyelesaikan checklist di atas. Checklist ini relevan ketika platform akan benar-benar
dioperasikan dengan pengguna dan uang sungguhan. Urutan prioritas realistis:

1. Fase 1 (hosting + domain) — agar bisa didemokan sebagai link publik, bukan cuma `localhost`.
2. Fase 3, khusus **payment gateway** — ini yang paling terasa sebagai "belum nyata" oleh pengguna.
3. Fase 2 (keamanan dasar) — wajib sebelum ada data pengguna sungguhan.
4. Fase lainnya menyusul sesuai roadmap bertahap (MVP → Pilot → Growth → Scale) di blueprint.
