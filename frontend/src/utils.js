export function formatRupiah(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d) {
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
}

export function formatDateTime(d) {
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d.replace(' ', 'T')));
}

export const STAGE_LABELS = {
  panen: 'Dipanen',
  grading: 'Lolos Grading',
  gudang: 'Masuk Gudang',
  dipasarkan: 'Tayang di Marketplace',
  habis: 'Stok Habis',
};

export const STATUS_PESANAN_LABELS = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  dibayar: 'Sudah Dibayar',
  disiapkan: 'Sedang Disiapkan',
  dikirim: 'Dalam Pengiriman',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
