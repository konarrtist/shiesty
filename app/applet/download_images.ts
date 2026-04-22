import fs from 'fs';
import path from 'path';
import https from 'https';

const REPO_TREE_URL = 'https://api.github.com/repos/konarrtist/Shiestybot/git/trees/main?recursive=1';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/konarrtist/Shiestybot/main/';
const TARGET_DIR = path.join(process.cwd(), 'public', 'images', 'blueprints');

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function downloadImages() {
  console.log('Fetching repo tree...');
  
  const treeData = await new Promise<any>((resolve, reject) => {
    https.get(REPO_TREE_URL, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const imagePaths = treeData.tree
    .filter((node: any) => node.path.startsWith('frontend/public/images/blueprints/') && node.path.endsWith('.png'))
    .map((node: any) => node.path);

  console.log(`Found ${imagePaths.length} images. Downloading...`);

  for (const imgPath of imagePaths) {
    const filename = path.basename(imgPath);
    const targetPath = path.join(TARGET_DIR, filename);
    const fileUrl = RAW_BASE_URL + imgPath;

    await new Promise<void>((resolve, reject) => {
      https.get(fileUrl, (res) => {
        if (res.statusCode === 200) {
          const fileStream = fs.createWriteStream(targetPath);
          res.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded: ${filename}`);
            resolve();
          });
        } else {
          console.error(`Failed to download ${filename}: ${res.statusCode}`);
          resolve(); // Continue even if one fails
        }
      }).on('error', (err) => {
        console.error(`Error downloading ${filename}:`, err.message);
        resolve();
      });
    });
  }
  
  console.log('All downloads finished!');
}

downloadImages().catch(console.error);
