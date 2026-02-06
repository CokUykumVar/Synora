const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/synora-icon.png');
const outputPath = path.join(__dirname, '../assets/synora-icon-1024.png');

async function resizeIcon() {
  try {
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original size: ${metadata.width}x${metadata.height}`);

    // Create 1024x1024 with black background, center the image
    await sharp(inputPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 11, g: 13, b: 16, alpha: 1 } // #0B0D10
      })
      .png()
      .toFile(outputPath);

    console.log('✅ Icon created: assets/synora-icon-1024.png (1024x1024)');
    console.log('Now rename it to synora-icon.png to use it');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

resizeIcon();
