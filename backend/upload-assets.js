/**
 * Upload static assets from customer-website/src/assets to Cloudinary
 * Run: node upload-assets.js
 */
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const assetsDir = path.join(__dirname, '../customer-website/src/assets');
const outputMapFile = path.join(__dirname, '../customer-website/src/cloudinary-assets.json');

const uploadAssets = async () => {
  if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory not found at: ${assetsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(assetsDir);
  console.log(`🚀 Found ${files.length} assets to upload...`);

  const mapping = {};

  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) continue;

    const fileExt = path.extname(file);
    const fileNameWithoutExt = path.basename(file, fileExt);

    console.log(`  ⬆️  Uploading ${file}...`);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'dfc-restaurant/assets',
        public_id: fileNameWithoutExt,
        resource_type: 'auto',
      });
      // Cloudinary will return a secure_url.
      // We can use secure_url as is, or we can transform it to load even faster!
      // For instance, we can enforce f_auto (format auto) and q_auto (quality auto)
      // to serve optimized WebP/AVIF images.
      const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
      mapping[file] = optimizedUrl;
      console.log(`  ✅  Uploaded ${file} -> ${optimizedUrl}`);
    } catch (err) {
      console.error(`  ❌  Failed to upload ${file}:`, err.message);
    }
  }

  fs.writeFileSync(outputMapFile, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\n🎉 Upload completed! Mapping written to ${outputMapFile}`);
};

uploadAssets().catch((err) => {
  console.error('❌ Script failed:', err);
});
