
const fs = require('fs');
const path = require('path');

// CLI args or defaults
const [srcDir = '.', outDir = 'dist'] = process.argv.slice(2);

// Clean (or create) the output directory
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Recursively process files in srcDir, skipping outDir
processDir(srcDir);

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip the output directory if it's inside srcDir
      if (fullPath === path.resolve(outDir)) continue;
      processDir(fullPath);
    } else if (entry.isFile()) {
      handleFile(fullPath);
    }
  }
}

function handleFile(filePath) {
  const relPath = path.relative(srcDir, filePath);
  const ext = path.extname(relPath).toLowerCase();

  if (ext === '.html') moveHtml(relPath);
  else copyAsset(relPath);
}

function moveHtml(relPath) {
  const name = path.basename(relPath, '.html');
  const dir = path.dirname(relPath);
  const destFolder = (name === 'index' && dir === '')
    ? outDir
    : path.join(outDir, dir, name);

  fs.mkdirSync(destFolder, { recursive: true });
  fs.copyFileSync(
    path.join(srcDir, relPath),
    path.join(destFolder, 'index.html')
  );
  console.log(`Converted: ${relPath} → ${path.relative('.', destFolder)}/index.html`);
}

function copyAsset(relPath) {
  const destPath = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(
    path.join(srcDir, relPath),
    destPath
  );
  console.log(`Copied asset: ${relPath}`);
}