const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Backgrounds
      content = content.replace(/bg-\[#1F2833\]\/\d+/g, 'bg-glass-bg');
      content = content.replace(/bg-\[#1F2833\]/g, 'bg-glass-bg');
      
      // Borders
      content = content.replace(/border-white\/5/g, 'border-glass-border');
      content = content.replace(/border-white\/10/g, 'border-glass-border');
      content = content.replace(/divide-white\/5/g, 'divide-glass-border');
      
      // Table texts and secondary texts that are explicitly gray but shouldn't be in light mode
      content = content.replace(/text-gray-400/g, 'text-muted');
      content = content.replace(/text-gray-300/g, 'text-muted');
      
      // Table hover states
      content = content.replace(/hover:bg-white\/5/g, 'hover:bg-nav-hover');
      content = content.replace(/hover:bg-white\/\[0\.02\]/g, 'hover:bg-nav-hover');
      content = content.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:bg-nav-hover');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'app'));
