const fs = require('fs');
const path = require('path');

// Create simple PNG data URLs as placeholders
function createIconDataURL(size) {
  // Simple pink square with white text
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FF6B9D" rx="${size * 0.2}"/>
      <circle cx="${size/2}" cy="${size*0.4}" r="${size*0.18}" fill="white" opacity="0.9"/>
      <text x="${size/2}" y="${size*0.45}" font-size="${size*0.25}" text-anchor="middle" fill="#FF6B9D" font-family="sans-serif" font-weight="bold">つ</text>
      <text x="${size/2}" y="${size*0.78}" font-size="${size*0.25}" text-anchor="middle" fill="white">🌸</text>
    </svg>
  `;
  return canvas;
}

// Write SVG files that can be referenced
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createIconDataURL(size);
  const filename = path.join(__dirname, 'public', `icon-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// Create PNG placeholders using Node.js Buffer
// These are minimal 1x1 pink PNGs that will be replaced by the build process
const pinkPixelPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

sizes.forEach(size => {
  const filename = path.join(__dirname, 'public', `icon-${size}.png`);
  fs.writeFileSync(filename, pinkPixelPNG);
  console.log(`Created placeholder ${filename}`);
});

console.log('Icons created! Replace PNG placeholders with proper icons later.');
