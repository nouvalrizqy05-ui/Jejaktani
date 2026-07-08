const fs = require('fs');

const overrides = {
  'Kopi Arabika Kintamani': 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&h=400&fit=crop',
  'Kopi Robusta Bali': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
  'Daging Ayam Broiler': 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=400&fit=crop',
  'Daging Sapi Has Dalam': 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400&h=400&fit=crop',
  'Ikan Nila Segar': 'https://images.unsplash.com/photo-1516045164472-73a726ea8d60?w=400&h=400&fit=crop',
  'Udang Vaname Segar': 'https://images.unsplash.com/photo-1625944230945-1b7dd12a8a16?w=400&h=400&fit=crop',
  'Telur Puyuh Segar': 'https://images.unsplash.com/photo-1587486913049-53fc88980fdc?w=400&h=400&fit=crop',
  'Salak Pondoh Sleman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Salak_fruits_Salacca_zalacca.jpg/400px-Salak_fruits_Salacca_zalacca.jpg',
  'Kelapa Muda Hijau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Young_coconut.jpg/400px-Young_coconut.jpg',
  'Durian Montong': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Durian_in_white_background.jpg/400px-Durian_in_white_background.jpg',
  'Melon Golden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Kharbuja.jpg/400px-Kharbuja.jpg',
  'Beras Pandanwangi Premium': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice.jpg/400px-White_rice.jpg',
  'Beras Merah Organik': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Red_rice.jpg/400px-Red_rice.jpg',
  'Beras Hitam Cianjur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Black_rice_on_a_plate.jpg/400px-Black_rice_on_a_plate.jpg',
  'Beras Ketan Putih': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice.jpg/400px-White_rice.jpg',
  'Bawang Putih Kating': 'https://images.unsplash.com/photo-1580424564858-a40d5885cdae?w=400&h=400&fit=crop',
  'Gula Pasir Lokal': 'https://images.unsplash.com/photo-1622484211148-de1f61ca7d8c?w=400&h=400&fit=crop',
  'Tomat Merah Segar': 'https://images.unsplash.com/photo-1518977676601-b32ae3fa4613?w=400&h=400&fit=crop',
  'Kentang Dieng Premium': 'https://images.unsplash.com/photo-1518977956812-cd3adada459f?w=400&h=400&fit=crop',
  'Brokoli Hijau Segar': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&h=400&fit=crop',
  'Jahe Merah Emprit': 'https://images.unsplash.com/photo-1615485500704-8e990f9900f1?w=400&h=400&fit=crop'
};

const content = fs.readFileSync('src/seed.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('nama:')) {
    const nameMatch = line.match(/nama:\s*'([^']+)'/);
    if (nameMatch) {
      const name = nameMatch[1];
      if (overrides[name]) {
        lines[i] = line.replace(/img:\s*'[^']+'/, `img: '${overrides[name]}'`);
        console.log(`Replaced image for ${name}`);
      }
    }
  }
}

fs.writeFileSync('src/seed.js', lines.join('\n'));
console.log('Done!');
