const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if we need to add useToast
  if (content.includes('alert(') || content.includes('alert (')) {
    if (!content.includes('useToast')) {
      // Find the first import
      content = content.replace(/(import .*?;)/, "$1\nimport { useToast } from '../context/ToastContext.jsx';");
      // Find the component function declaration to insert `const { showToast } = useToast();`
      content = content.replace(/(export default function \w+\(.*?\)\s*\{)/, "$1\n  const { showToast } = useToast();");
    }
    // Replace alert('...') with showToast('...', 'info')
    // We'll just do a simple replacement for typical alert(e.message) and alert('text')
    content = content.replace(/alert\((.*?)\)/g, "showToast($1, 'info')");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

// Custom fix for Home.jsx Baca Blog button
const homePath = path.join(pagesDir, 'Home.jsx');
let homeContent = fs.readFileSync(homePath, 'utf8');
if (!homeContent.includes('useToast')) {
  homeContent = homeContent.replace(/(import .*?;)/, "$1\nimport { useToast } from '../context/ToastContext.jsx';");
  homeContent = homeContent.replace(/(export default function \w+\(.*?\)\s*\{)/, "$1\n  const { showToast } = useToast();");
}
homeContent = homeContent.replace(/onClick=\{\(\) => \{\}\}\s*className="text-sm text-teal-600 font-semibold hover:underline">Baca Blog<\/button>/g, `onClick={() => showToast('Fitur Blog Edukasi akan segera hadir di versi produksi!', 'info')} className="text-sm text-teal-600 font-semibold hover:underline">Baca Blog</button>`);
fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Updated Home.jsx Baca Blog button');

