import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, uid } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, nama, role, no_hp, desa, alamat, tipe_buyer, nama_usaha, npwp } = req.body;

  if (!email || !password || !nama || !role) {
    return res.status(400).json({ error: 'Email, password, nama, dan peran wajib diisi.' });
  }
  if (!['petani', 'buyer'].includes(role)) {
    return res.status(400).json({ error: 'Pendaftaran mandiri hanya tersedia untuk peran petani atau buyer.' });
  }

  // Password validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number or special char
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#\$%\^&\*]).{8,}$/;
  if (!strongRegex.test(password)) {
    return res.status(400).json({ error: 'Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka/simbol.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk.' });

  const userId = uid('usr');
  db.prepare(`INSERT INTO users (id,email,password_hash,role,nama,no_hp) VALUES (?,?,?,?,?,?)`)
    .run(userId, email, bcrypt.hashSync(password, 10), role, nama, no_hp || null);

  if (role === 'petani') {
    const petaniId = uid('tani');
    db.prepare(`INSERT INTO petani (id,user_id,alamat,desa) VALUES (?,?,?,?)`)
      .run(petaniId, userId, alamat || '', desa || '');
  } else if (role === 'buyer') {
    const buyerId = uid('byr');
    db.prepare(`INSERT INTO buyer (id,user_id,tipe,nama_usaha,npwp,alamat) VALUES (?,?,?,?,?,?)`)
      .run(buyerId, userId, tipe_buyer === 'b2b' ? 'b2b' : 'b2c', nama_usaha || null, npwp || null, alamat || null);
  }

  const token = signToken({ id: userId, email, role, nama });
  res.status(201).json({ token, user: { id: userId, email, role, nama } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Email atau kata sandi salah.' });
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role, nama: user.nama });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, nama: user.nama } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id,email,role,nama,no_hp FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  let profile = null;
  if (user.role === 'petani') {
    profile = db.prepare('SELECT * FROM petani WHERE user_id = ?').get(user.id);
  } else if (user.role === 'buyer') {
    profile = db.prepare('SELECT * FROM buyer WHERE user_id = ?').get(user.id);
  }
  res.json({ user, profile });
});

export default router;
