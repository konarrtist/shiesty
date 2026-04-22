import fs from 'fs';
import path from 'path';
import https from 'https';

const REPO_OWNER = 'konarrtist';
const REPO_NAME = 'shiestyseason';
const BRANCH = 'main';

async function fetchGitHub(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Node.js' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode} ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function processContents(contents, targetBase) {
  for (const item of contents) {
    const relativePath = item.path.replace('frontend/', '');
    const targetPath = path.join(process.cwd(), relativePath);
    
    if (item.type === 'dir') {
      console.log(`Creating directory ${targetPath}`);
      const subContents = await fetchGitHub(item.url);
      await processContents(subContents, targetBase);
    } else {
      console.log(`Downloading ${item.download_url} to ${targetPath}`);
      await downloadFile(item.download_url, targetPath);
    }
  }
}

async function run() {
  try {
    console.log('Starting migration...');
    const frontendContents = await fetchGitHub(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/frontend`);
    await processContents(frontendContents, '');
    
    // Also get root files like tailwind.config.js if they are in frontend/
    // The previous processContents already handles everything under frontend/
    
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
