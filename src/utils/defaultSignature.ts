// Default realistic digital signature with blue ink cursive strokes and subtle official seal
export const DEFAULT_SIGNATURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" width="240" height="100">
  <defs>
    <filter id="sig-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="0.5" flood-color="#1e3a8a" flood-opacity="0.2"/>
    </filter>
  </defs>
  <!-- Background transparent -->
  <!-- Official circular stamp watermark outline -->
  <circle cx="65" cy="50" r="38" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="4 2" opacity="0.35" />
  <circle cx="65" cy="50" r="32" fill="none" stroke="#2563eb" stroke-width="1" opacity="0.25" />
  <text x="65" y="46" font-family="sans-serif" font-size="6.5" font-weight="bold" fill="#1e40af" text-anchor="middle" opacity="0.45" letter-spacing="1">SMK N 1</text>
  <text x="65" y="56" font-family="sans-serif" font-size="5.5" font-weight="bold" fill="#1e40af" text-anchor="middle" opacity="0.45" letter-spacing="0.5">PEMALANG</text>
  
  <!-- Cursive signature path in navy blue ink -->
  <path d="M 35 65 Q 45 25 58 45 T 75 40 T 95 62 Q 110 30 125 50 T 145 42 Q 160 55 180 50 Q 200 45 215 52 M 60 48 Q 110 75 195 58 M 105 40 Q 115 20 120 68" 
        fill="none" stroke="#1d4ed8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#sig-shadow)"/>
  <path d="M 45 68 Q 90 78 175 66" fill="none" stroke="#1e40af" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

export const DEFAULT_SIGNATURE_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_SIGNATURE_SVG)}`;
