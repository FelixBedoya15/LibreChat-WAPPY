const fs = require('fs-extra');

async function postBuild() {
  try {
    await fs.copy('public/assets', 'dist/assets');
    await fs.copy('public/robots.txt', 'dist/robots.txt');
    if (await fs.pathExists('public/videos')) {
      await fs.copy('public/videos', 'dist/videos');
    }
    if (await fs.pathExists('public/images')) {
      await fs.copy('public/images', 'dist/images');
    }
    console.log('✅ PWA icons, videos, images and robots.txt copied successfully.');
  } catch (err) {
    console.error('❌ Error copying files:', err);
    process.exit(1);
  }
}

postBuild();
