const fs = require('fs-extra');

async function postBuild() {
  try {
    await fs.copy('public/assets', 'dist/assets');
    await fs.copy('public/robots.txt', 'dist/robots.txt');
    if (await fs.pathExists('public/sitemap.xml')) {
      await fs.copy('public/sitemap.xml', 'dist/sitemap.xml');
    }
    if (await fs.pathExists('public/videos')) {
      await fs.copy('public/videos', 'dist/videos');
    }
    if (await fs.pathExists('public/images')) {
      await fs.copy('public/images', 'dist/images');
    }
    if (await fs.pathExists('public/wappystudio.html')) {
      await fs.copy('public/wappystudio.html', 'dist/wappystudio.html');
      await fs.copy('public/wappystudio.html', 'dist/assets/wappystudio.html');
    }
    if (await fs.pathExists('public/wappypodcast.html')) {
      await fs.copy('public/wappypodcast.html', 'dist/wappypodcast.html');
      await fs.copy('public/wappypodcast.html', 'dist/assets/wappypodcast.html');
    }
    if (await fs.pathExists('public/matrizipvr.html')) {
      await fs.copy('public/matrizipvr.html', 'dist/matrizipvr.html');
      await fs.copy('public/matrizipvr.html', 'dist/assets/matrizipvr.html');
    }
    console.log('✅ PWA icons, videos, images and robots.txt copied successfully.');
  } catch (err) {
    console.error('❌ Error copying files:', err);
    process.exit(1);
  }
}

postBuild();
