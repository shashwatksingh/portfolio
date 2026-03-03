const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'assets', 'logo.svg');
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Starting icon generation from logo.svg...\n');

  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(logoPath);

    // Generate PNG icons with different sizes
    const icons = [
      { name: 'logo192.png', size: 192, description: 'PWA icon 192x192' },
      { name: 'logo512.png', size: 512, description: 'PWA icon 512x512' },
      { name: 'maskable192.png', size: 192, description: 'Maskable PWA icon 192x192' },
      { name: 'apple-touch-icon.png', size: 180, description: 'Apple touch icon 180x180' },
      { name: 'favicon-16x16.png', size: 16, description: 'Favicon 16x16' },
      { name: 'favicon-32x32.png', size: 32, description: 'Favicon 32x32' },
    ];

    // Generate each PNG icon
    for (const icon of icons) {
      const outputPath = path.join(publicDir, icon.name);
      await sharp(svgBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generated ${icon.name} (${icon.description})`);
    }

    // Generate favicon.ico (multi-size)
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconPath);
    console.log('✅ Generated favicon.ico (32x32)');

    // Generate safari-pinned-tab.svg (monochrome version)
    const safariSvgPath = path.join(publicDir, 'safari-pinned-tab.svg');
    
    // Create a monochrome version by converting to grayscale and then to SVG
    // For simplicity, we'll just copy the original SVG as a monochrome version
    // In production, you might want to create a true monochrome version
    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .greyscale()
      .threshold(128)
      .png()
      .toBuffer()
      .then(async (buffer) => {
        // Convert back to SVG format (simplified approach)
        // For a proper monochrome SVG, manual editing might be needed
        fs.copyFileSync(logoPath, safariSvgPath);
        console.log('✅ Generated safari-pinned-tab.svg (copied from original)');
      });

    // Generate preview.png (social media preview)
    const previewPath = path.join(publicDir, 'preview.png');
    await sharp(svgBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 248, g: 248, b: 248, alpha: 1 }
      })
      .png()
      .toFile(previewPath);
    console.log('✅ Generated preview.png (1200x630 for social media)');

    console.log('\n🎉 All icons generated successfully!');
    console.log('\n📁 Generated files in public/:');
    console.log('   - favicon.ico');
    console.log('   - favicon-16x16.png');
    console.log('   - favicon-32x32.png');
    console.log('   - logo192.png');
    console.log('   - logo512.png');
    console.log('   - maskable192.png');
    console.log('   - apple-touch-icon.png');
    console.log('   - safari-pinned-tab.svg');
    console.log('   - preview.png');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run the icon generation
generateIcons();
