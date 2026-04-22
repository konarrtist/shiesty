import fs from 'fs';
import https from 'https';

const files = [
  { url: 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/app/layout.tsx', path: 'layout.tsx' },
  { url: 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/app/config/rarityConfig.ts', path: 'rarityConfig.ts' },
  { url: 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/data/items_database.json', path: 'items_database.json' },
  { url: 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/app/config/categoryConfig.ts', path: 'categoryConfig.ts' },
  { url: 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/app/config/cytoscapeStyles.ts', path: 'cytoscapeStyles.ts' },
  { url: 'https://raw.githubusercontent.com/wangyz1999/arcforge/main/data/special_item_types.json', path: 'special_item_types.json' }
];

files.forEach(file => {
  https.get(file.url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      fs.writeFileSync(file.path, data);
      console.log(`Downloaded ${file.path}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${file.path}: ${err.message}`);
  });
});
