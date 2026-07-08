import axios from 'axios';

/**
 * Mengambil data cuaca dan suhu real-time berdasarkan koordinat GPS
 * Menggunakan Open-Meteo API (gratis, tanpa API key).
 * 
 * @param {string} gpsString - Format "lat,lon" e.g., "-6.81432, 107.14321"
 * @returns {Promise<{suhu_celcius: number, cuaca: string, kondisi_cold_chain: string}>}
 */
async function fetchCurrentClimate(gpsString) {
  try {
    if (!gpsString || !gpsString.includes(',')) {
      throw new Error('Format GPS tidak valid');
    }

    const [lat, lon] = gpsString.split(',').map(s => s.trim());
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Koordinat GPS bukan angka valid');
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const current = response.data.current;

    const suhu = current.temperature_2m;
    const code = current.weather_code;

    // Interpretasi standar WMO Weather Code
    let cuaca = 'Cerah';
    if (code >= 1 && code <= 3) cuaca = 'Berawan';
    else if (code >= 45 && code <= 48) cuaca = 'Berkabut';
    else if (code >= 51 && code <= 67) cuaca = 'Hujan';
    else if (code >= 71 && code <= 77) cuaca = 'Salju';
    else if (code >= 80 && code <= 82) cuaca = 'Hujan Deras';
    else if (code >= 95) cuaca = 'Badai Petir';

    // Logika sederhana untuk kondisi cold chain berdasarkan suhu lingkungan
    let kondisi = 'Aman';
    if (suhu > 30) {
      kondisi = 'Peringatan: Suhu Lingkungan Tinggi (Rawan Susut)';
    } else if (suhu > 25) {
      kondisi = 'Perlu Perhatian Ekstra';
    }

    return {
      suhu_celcius: suhu,
      cuaca: cuaca,
      kondisi_cold_chain: kondisi
    };
  } catch (error) {
    console.error('[Climate API Error]:', error.message);
    // Fallback jika API gagal/timeout agar proses bisnis tidak terhenti
    return {
      suhu_celcius: 28.5,
      cuaca: 'Tidak Tersedia',
      kondisi_cold_chain: 'Fallback (API Error)'
    };
  }
}

export { fetchCurrentClimate };
