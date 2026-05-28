const sharp = require('sharp');

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#1A1714"/>

  <!-- Orange top bar -->
  <rect width="1200" height="10" fill="#FF6B2B"/>

  <!-- Orange left accent block -->
  <rect x="0" y="0" width="6" height="630" fill="#FF6B2B"/>

  <!-- Large background K watermark -->
  <text x="820" y="520" font-family="Arial Black, Arial" font-size="480" font-weight="900" fill="#FF6B2B" opacity="0.07">K</text>

  <!-- KAZISHOW wordmark -->
  <text x="80" y="180" font-family="Arial Black, Arial" font-size="96" font-weight="900" fill="white">Kazi</text>
  <text x="308" y="180" font-family="Arial Black, Arial" font-size="96" font-weight="900" fill="#FF6B2B">Show</text>

  <!-- Kenya badge -->
  <rect x="80" y="200" width="200" height="36" rx="18" fill="#FF6B2B"/>
  <text x="180" y="223" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">🇰🇪 KENYA'S #1 PLATFORM</text>

  <!-- Main headline -->
  <text x="80" y="310" font-family="Arial Black, Arial" font-size="48" font-weight="900" fill="white">Find Verified Service</text>
  <text x="80" y="368" font-family="Arial Black, Arial" font-size="48" font-weight="900" fill="white">Providers in <tspan fill="#FF6B2B">Nairobi</tspan></text>

  <!-- Subtext -->
  <text x="80" y="420" font-family="Arial, sans-serif" font-size="26" fill="#94a3b8">Plumbers · Electricians · Hotels · Salons · Restaurants</text>
  <text x="80" y="458" font-family="Arial, sans-serif" font-size="26" fill="#94a3b8">All verified. Book in 30 seconds. FREE to use.</text>

  <!-- Stats bar -->
  <rect x="80" y="498" width="1040" height="2" fill="#FF6B2B" opacity="0.4"/>

  <!-- Stats -->
  <text x="80" y="545" font-family="Arial Black, Arial" font-size="32" font-weight="900" fill="#FF6B2B">500+</text>
  <text x="80" y="575" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Providers</text>

  <text x="280" y="545" font-family="Arial Black, Arial" font-size="32" font-weight="900" fill="#FF6B2B">2,000+</text>
  <text x="280" y="575" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Customers</text>

  <text x="510" y="545" font-family="Arial Black, Arial" font-size="32" font-weight="900" fill="#FF6B2B">5,000+</text>
  <text x="510" y="575" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Bookings</text>

  <text x="740" y="545" font-family="Arial Black, Arial" font-size="32" font-weight="900" fill="#FF6B2B">4.8 ★</text>
  <text x="740" y="575" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Rating</text>

  <!-- URL -->
  <rect x="900" y="510" width="220" height="56" rx="28" fill="#FF6B2B"/>
  <text x="1010" y="545" font-family="Arial Black, Arial" font-size="20" font-weight="900" fill="white" text-anchor="middle">kazishow.co.ke</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/og-image.png')
  .then(() => console.log('✅ OG image created at public/og-image.png'))
  .catch(err => console.error('❌ Error:', err));
