import { db } from './src/db.js';
try {
  console.log(db.prepare('SELECT * FROM sertifikasi_produk WHERE produk_id = ? AND status = "terverifikasi"').all('test'));
  console.log('SUCCESS');
} catch (e) {
  console.error(e);
}
