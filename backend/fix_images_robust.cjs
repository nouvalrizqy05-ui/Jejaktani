const fs = require('fs');

async function getWikiImage(title) {
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400`, {
      headers: {
        'User-Agent': 'JejakTaniFixer/1.0 (admin@jejaktani.id)'
      }
    });
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId !== '-1' && pages[pageId].thumbnail) {
      return pages[pageId].thumbnail.source;
    }
  } catch (e) {
    console.error('Error fetching', title, e.message);
  }
  return null;
}

const terms = {
  'Beras Pandanwangi Premium': 'Rice',
  'Beras Merah Organik': 'Brown_rice',
  'Beras Hitam Cianjur': 'Black_rice',
  'Beras Ketan Putih': 'Glutinous_rice',
  'Gula Pasir Lokal': 'Sugar',
  'Bawang Putih Kating': 'Garlic',
  'Tomat Merah Segar': 'Tomato',
  'Kentang Dieng Premium': 'Potato',
  'Brokoli Hijau Segar': 'Broccoli',
  'Jahe Merah Emprit': 'Ginger',
  'Kunyit Segar': 'Turmeric',
  'Salak Pondoh Sleman': 'Salak',
  'Kelapa Muda Hijau': 'Coconut',
  'Durian Montong': 'Durian',
  'Melon Golden': 'Muskmelon',
  'Daging Ayam Broiler': 'Chicken_meat',
  'Daging Sapi Has Dalam': 'Beef',
  'Ikan Nila Segar': 'Nile_tilapia',
  'Udang Vaname Segar': 'Whiteleg_shrimp',
  'Telur Puyuh Segar': 'Quail_eggs'
};

async function main() {
  const content = fs.readFileSync('src/seed.js', 'utf8');
  let lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('nama:')) {
      const nameMatch = line.match(/nama:\s*'([^']+)'/);
      const urlMatch = line.match(/img:\s*'([^']+)'/);
      if (nameMatch && urlMatch) {
        const name = nameMatch[1];
        const url = urlMatch[1];
        
        // If it's a known broken URL from Wikimedia or Unsplash 404s
        if (url.includes('wikimedia') || terms[name]) {
          const searchTitle = terms[name] || name.split(' ')[0];
          console.log(`Fetching Wikipedia image for ${name} (using title: ${searchTitle})...`);
          const newUrl = await getWikiImage(searchTitle);
          if (newUrl) {
            lines[i] = line.replace(/img:\s*'[^']+'/, `img: '${newUrl}'`);
            console.log(` -> SUCCESS: ${newUrl}`);
          } else {
             // Ultimate fallback: an abstract gradient or a generic placeholder so it's NOT broken.
             const fallback = `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`;
             lines[i] = line.replace(/img:\s*'[^']+'/, `img: '${fallback}'`);
             console.log(` -> FAILED. Using fallback: ${fallback}`);
          }
          // sleep 1 second to avoid rate limits
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  fs.writeFileSync('src/seed.js', lines.join('\n'));
  console.log('All done! Seed file updated.');
}

main();
