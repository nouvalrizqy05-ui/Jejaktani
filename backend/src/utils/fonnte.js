// Built-in fetch (Node 18+)
/**
 * Mengirim pesan WhatsApp melalui API Fonnte
 * @param {string} target - Nomor tujuan (misal: '081234567890')
 * @param {string} message - Isi pesan teks
 */
export async function sendWhatsApp(target, message) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.warn('FONNTE_TOKEN tidak ditemukan. Lewati pengiriman WhatsApp.');
    return false;
  }

  // Jika target kosong atau simulasi lokal tanpa nomor
  if (!target || target === '-') {
    console.log(`[SIMULASI WA] Target tidak valid, pesan: ${message}`);
    return false;
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: target,
        message: message,
        countryCode: '62'
      })
    });

    const data = await response.json();
    if (data.status) {
      console.log(`Berhasil kirim WA ke ${target}: ${data.detail}`);
      return true;
    } else {
      console.error(`Gagal kirim WA ke ${target}:`, data.reason || data.detail);
      return false;
    }
  } catch (error) {
    console.error(`Error HTTP ke Fonnte:`, error.message);
    return false;
  }
}
