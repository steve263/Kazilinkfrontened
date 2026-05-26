const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons', { recursive: true });
}

sizes.forEach(size => {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.52);

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#FF6B2B"/>
  <text x="50%" y="54%" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="middle">K</text>
</svg>`;

  sharp(Buffer.from(svg))
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`Created icon-${size}x${size}.png`))
    .catch(err => console.error(`Error creating ${size}x${size}:`, err));
});

// Also generate 32x32 for favicon
const size32 = 32;
const svg32 = `<svg width="${size32}" height="${size32}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size32}" height="${size32}" rx="7" fill="#FF6B2B"/>
  <text x="50%" y="54%" font-family="Arial Black, Arial, sans-serif" font-size="18" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="middle">K</text>
</svg>`;

sharp(Buffer.from(svg32))
  .png()
  .toFile('public/icons/icon-32x32.png')
  .then(() => console.log('Created icon-32x32.png'))
  .catch(err => console.error('Error creating 32x32:', err));
