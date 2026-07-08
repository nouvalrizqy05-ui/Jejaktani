const fs = require('fs');

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function getWikiImage(query) {
  try {
    const res = await fetch(`https://id.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400`);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId !== '-1' && pages[pageId].thumbnail) {
      return pages[pageId].thumbnail.source;
    }
    
    // Try English wiki if ID wiki fails
    const resEn = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400`);
    const dataEn = await resEn.json();
    const pagesEn = dataEn.query.pages;
    const pageIdEn = Object.keys(pagesEn)[0];
    if (pageIdEn !== '-1' && pagesEn[pageIdEn].thumbnail) {
      return pagesEn[pageIdEn].thumbnail.source;
    }
  } catch (e) {
    console.error('Wiki error for', query, e);
  }
  return null;
}

const fallbacks = {
  'Sayur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vegetables_in_market.jpg/400px-Vegetables_in_market.jpg',
  'Buah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Culinary_fruits_front_view.jpg/400px-Culinary_fruits_front_view.jpg',
  'Bumbu masak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Indian_spices.jpg/400px-Indian_spices.jpg',
  'Lauk pauk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Gourmet_meat.jpg/400px-Gourmet_meat.jpg',
  'Organik': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vegetables_in_market.jpg/400px-Vegetables_in_market.jpg',
  'Sembako': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Various_grains.jpg/400px-Various_grains.jpg'
};

async function main() {
  const content = fs.readFileSync('src/seed.js', 'utf8');
  let newContent = content;
  
  // Parse all product lines
  const lines = content.split('\n');
  let modified = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('nama:') && line.includes('img:')) {
      // extract nama, kategori, img
      const nameMatch = line.match(/nama:\s*'([^']+)'/);
      const catMatch = line.match(/kategori:\s*'([^']+)'/);
      const imgMatch = line.match(/img:\s*'([^']+)'/);
      
      if (nameMatch && imgMatch) {
        const name = nameMatch[1];
        const category = catMatch ? catMatch[1] : 'Sayur';
        const url = imgMatch[1];
        
        const isOk = await checkUrl(url);
        if (!isOk) {
          console.log(`[BROKEN] ${name} -> ${url}`);
          const searchTerms = [
            name.split(' ')[0], // first word e.g. "Salak"
            name.split(' ').slice(0, 2).join(' '), // two words
            category
          ];
          
          let newUrl = null;
          for (let term of searchTerms) {
            newUrl = await getWikiImage(term);
            if (newUrl) break;
          }
          
          if (!newUrl) {
             newUrl = fallbacks[category] || fallbacks['Sayur'];
          }
          
          console.log(`[FIXED] ${name} -> ${newUrl}`);
          newContent = newContent.replace(url, newUrl);
          modified++;
        }
      }
    }
  }
  
  fs.writeFileSync('src/seed.js', newContent);
  console.log(`Done! Fixed ${modified} images.`);
}

main();
