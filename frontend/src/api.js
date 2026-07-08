const BASE = '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(data?.error || `Terjadi kesalahan (${res.status})`);
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  // produk / marketplace
  listProduk: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/produk${qs ? `?${qs}` : ''}`);
  },
  getProduk: (id) => request(`/produk/${id}`),
  listKategori: () => request('/produk/kategori/list'),
  createProduk: (payload, token) => request('/produk', { method: 'POST', body: payload, token }),
  updateProdukStatus: (id, payload, token) => request(`/produk/${id}/status`, { method: 'PATCH', body: payload, token }),
  myProduk: (token) => request('/produk/mine/list', { token }),
  aiGrading: (payload, token) => request('/produk/ai-grading', { method: 'POST', body: payload, token }),

  // trace (public)
  getTrace: (id) => request(`/trace/${id}`),

  // harga
  listHarga: () => request('/harga'),
  getHargaHistoris: (komoditas) => request(`/harga/historis/${komoditas}`),

  // pesanan
  createPesanan: (payload, token) => request('/pesanan', { method: 'POST', body: payload, token }),
  createPayment: (payload, token) => request('/payment/create', { method: 'POST', body: payload, token }),
  bayarPesanan: (id, token) => request(`/pesanan/${id}/bayar`, { method: 'PATCH', token }),
  updatePesananStatus: (id, payload, token) => request(`/pesanan/${id}/status`, { method: 'PATCH', body: payload, token }),
  myPesanan: (token) => request('/pesanan/mine', { token }),
  getPesanan: (id, token) => request(`/pesanan/${id}`, { token }),

  // kontrak b2b
  createKontrak: (payload, token) => request('/kontrak', { method: 'POST', body: payload, token }),
  myKontrak: (token) => request('/kontrak/mine', { token }),
  updateKontrakStatus: (id, payload, token) => request(`/kontrak/${id}/status`, { method: 'PATCH', body: payload, token }),

  // rating
  createRating: (payload, token) => request('/rating', { method: 'POST', body: payload, token }),
  ratingsForUser: (userId) => request(`/rating/user/${userId}`),

  // petani
  petaniDashboard: (token) => request('/petani/dashboard', { token }),
  petaniPublic: (id) => request(`/petani/${id}`),

  // admin
  adminOverview: (token) => request('/admin/overview', { token }),
  adminGudang: (token) => request('/admin/gudang', { token }),
  adminArmada: (token) => request('/admin/armada', { token }),
  adminPesanan: (token) => request('/admin/pesanan', { token }),
  adminPetani: (token) => request('/admin/petani', { token }),
  adminRute: (token) => request('/rute/optimasi', { token }),
  
  // sertifikasi
  getSertifikasiProduk: (produkId) => request(`/sertifikasi/produk/${produkId}`),
  adminSertifikasiPending: (token) => request('/sertifikasi/pending', { token }),
  createSertifikasi: (payload, token) => request('/sertifikasi', { method: 'POST', body: payload, token }),
  verifikasiSertifikasi: (id, payload, token) => request(`/sertifikasi/${id}/verifikasi`, { method: 'PATCH', body: payload, token }),

  // sengketa
  mySengketa: (token) => request('/sengketa/mine', { token }),
  adminSengketa: (token) => request('/sengketa', { token }),
  createSengketa: (payload, token) => request('/sengketa', { method: 'POST', body: payload, token }),
  resolusiSengketa: (id, payload, token) => request(`/sengketa/${id}/resolusi`, { method: 'PATCH', body: payload, token }),

  // preorder
  listPreorder: () => request('/preorder'),
  createPreorder: (payload, token) => request('/preorder', { method: 'POST', body: payload, token }),
  pesanPreorder: (id, payload, token) => request(`/preorder/${id}/pesan`, { method: 'POST', body: payload, token }),

  // gudang stok
  adminGudangStok: (token) => request('/gudang-stok', { token }),
  transferStok: (payload, token) => request('/gudang-stok/transfer', { method: 'POST', body: payload, token }),

  // cold-chain
  getColdChain: (produkId, token) => request(`/cold-chain/${produkId}`, { token }),

  // logistik
  listLogistikVendors: () => request('/logistik/vendors'),
  cekOngkir: (payload) => request('/logistik/cek-ongkir', { method: 'POST', body: payload }),
};
