import os

def write_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# Country Flags (Exact aspect ratio 3:2 SVGs)
FLAGS = {
    "cz": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#ffffff"/>
  <rect width="600" height="200" y="200" fill="#d7141a"/>
  <polygon points="0,0 300,200 0,400" fill="#11457e"/>
</svg>''',
    "de": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="133.3" fill="#000000"/>
  <rect width="600" height="133.3" y="133.3" fill="#dd0000"/>
  <rect width="600" height="133.3" y="266.6" fill="#ffce00"/>
</svg>''',
    "fr": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="200" height="400" fill="#002395"/>
  <rect width="200" height="400" x="200" fill="#ffffff"/>
  <rect width="200" height="400" x="400" fill="#ed2939"/>
</svg>''',
    "it": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="200" height="400" fill="#009246"/>
  <rect width="200" height="400" x="200" fill="#ffffff"/>
  <rect width="200" height="400" x="400" fill="#ce2b37"/>
</svg>''',
    "es": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#aa151b"/>
  <rect width="600" height="200" y="100" fill="#f1bf00"/>
</svg>''',
    "nl": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="133.3" fill="#ae1c28"/>
  <rect width="600" height="133.3" y="133.3" fill="#ffffff"/>
  <rect width="600" height="133.3" y="266.6" fill="#21468b"/>
</svg>''',
    "be": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="200" height="400" fill="#000000"/>
  <rect width="200" height="400" x="200" fill="#fda510"/>
  <rect width="200" height="400" x="400" fill="#ef3340"/>
</svg>''',
    "at": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#ed2939"/>
  <rect width="600" height="133.3" y="133.3" fill="#ffffff"/>
</svg>''',
    "pl": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="200" fill="#ffffff"/>
  <rect width="600" height="200" y="200" fill="#dc143c"/>
</svg>''',
    "ch": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#d52b1e"/>
  <rect x="160" y="60" width="80" height="280" fill="#ffffff"/>
  <rect x="60" y="160" width="280" height="80" fill="#ffffff"/>
</svg>''',
    "gb": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#012169"/>
  <path d="M0,0 L600,400 M600,0 L0,400" stroke="#ffffff" stroke-width="60"/>
  <path d="M0,0 L600,400 M600,0 L0,400" stroke="#c8102e" stroke-width="20"/>
  <path d="M300,0 V400 M0,200 H600" stroke="#ffffff" stroke-width="100"/>
  <path d="M300,0 V400 M0,200 H600" stroke="#c8102e" stroke-width="60"/>
</svg>''',
    "us": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#b22234"/>
  <path d="M0,30.76h600M0,92.3h600M0,153.8h600M0,215.38h600M0,276.9h600M0,338.46h600" stroke="#ffffff" stroke-width="30.76"/>
  <rect width="240" height="215.38" fill="#3c3b6e"/>
  <circle cx="120" cy="107" r="40" fill="#ffffff" opacity="0.9"/>
</svg>''',
    "ca": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="150" height="400" fill="#ff0000"/>
  <rect width="300" height="400" x="150" fill="#ffffff"/>
  <rect width="150" height="400" x="450" fill="#ff0000"/>
  <path d="M300 110 L315 160 L350 150 L325 190 L360 210 L310 220 L300 280 L290 220 L240 210 L275 190 L250 150 L285 160 Z" fill="#ff0000"/>
</svg>''',
    "in": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="133.3" fill="#ff9933"/>
  <rect width="600" height="133.3" y="133.3" fill="#ffffff"/>
  <rect width="600" height="133.3" y="266.6" fill="#138808"/>
  <circle cx="300" cy="200" r="45" fill="none" stroke="#000080" stroke-width="4"/>
  <circle cx="300" cy="200" r="8" fill="#000080"/>
</svg>''',
    "ph": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="200" fill="#0038a8"/>
  <rect width="600" height="200" y="200" fill="#ce1126"/>
  <polygon points="0,0 280,200 0,400" fill="#ffffff"/>
  <circle cx="90" cy="200" r="28" fill="#fcd116"/>
</svg>''',
    "sg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="200" fill="#ef3340"/>
  <rect width="600" height="200" y="200" fill="#ffffff"/>
  <circle cx="120" cy="100" r="45" fill="#ffffff"/>
  <circle cx="135" cy="100" r="42" fill="#ef3340"/>
</svg>''',
    "ae": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="133.3" fill="#00732f"/>
  <rect width="600" height="133.3" y="133.3" fill="#ffffff"/>
  <rect width="600" height="133.3" y="266.6" fill="#000000"/>
  <rect width="180" height="400" fill="#ff0000"/>
</svg>''',
    "jp": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#ffffff"/>
  <circle cx="300" cy="200" r="120" fill="#bc002d"/>
</svg>''',
    "au": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#00008b"/>
  <path d="M0,0 L300,200 M300,0 L0,200" stroke="#ffffff" stroke-width="30"/>
  <path d="M150,0 V200 M0,100 H300" stroke="#ffffff" stroke-width="50"/>
  <path d="M150,0 V200 M0,100 H300" stroke="#cc0000" stroke-width="30"/>
  <polygon points="150,280 158,295 175,295 162,305 167,320 150,310 133,320 138,305 125,295 142,295" fill="#ffffff"/>
</svg>''',
    "eu": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#003399"/>
  <circle cx="300" cy="200" r="100" fill="none" stroke="#ffcc00" stroke-width="4" stroke-dasharray="1 25" />
  <circle cx="300" cy="200" r="10" fill="#ffcc00"/>
</svg>'''
}

for code, svg in FLAGS.items():
    write_file(f"public/assets/countries/{code}.svg", svg)


# Official Payment Method SVGs
PAYMENT_METHODS = {
    # Official NPCI Unified Payments Interface Logo
    "upi": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#1A1C23"/>
  <path d="M85 30 L115 60 L85 90 H50 L80 60 L50 30 H85 Z" fill="#008346"/>
  <path d="M100 30 L130 60 L100 90 H65 L95 60 L65 30 H100 Z" fill="#E21017"/>
  <text x="145" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" letter-spacing="1">UPI</text>
  <text x="145" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#7C8497" letter-spacing="2">UNIFIED PAYMENTS INTERFACE</text>
</svg>''',

    # Official UPI QR Payment Badge
    "upi-qr": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <rect width="200" height="200" rx="24" fill="#0D0F14"/>
  <rect x="20" y="20" width="160" height="160" rx="16" stroke="#262A36" stroke-width="2" fill="#141721"/>
  <!-- QR Corner Markers -->
  <rect x="40" y="40" width="36" height="36" rx="6" fill="none" stroke="#008346" stroke-width="6"/>
  <rect x="48" y="48" width="20" height="20" rx="2" fill="#008346"/>

  <rect x="124" y="40" width="36" height="36" rx="6" fill="none" stroke="#E21017" stroke-width="6"/>
  <rect x="132" y="48" width="20" height="20" rx="2" fill="#E21017"/>

  <rect x="40" y="124" width="36" height="36" rx="6" fill="none" stroke="#3B82F6" stroke-width="6"/>
  <rect x="48" y="132" width="20" height="20" rx="2" fill="#3B82F6"/>

  <!-- QR Data Dots -->
  <rect x="90" y="40" width="12" height="12" rx="3" fill="#E2E8F0"/>
  <rect x="90" y="64" width="12" height="24" rx="3" fill="#008346"/>
  <rect x="114" y="90" width="24" height="12" rx="3" fill="#E21017"/>
  <rect x="90" y="124" width="24" height="12" rx="3" fill="#E2E8F0"/>
  <rect x="124" y="124" width="12" height="24" rx="3" fill="#3B82F6"/>
  <rect x="148" y="148" width="12" height="12" rx="3" fill="#E2E8F0"/>
  <!-- Center UPI Badge -->
  <circle cx="100" cy="100" r="18" fill="#1A1C23" stroke="#262A36" stroke-width="2"/>
  <path d="M93 93 L107 100 L93 107 Z" fill="#008346"/>
</svg>''',

    # Official GCash Logo
    "gcash": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#005CE6"/>
  <circle cx="60" cy="60" r="28" stroke="#FFFFFF" stroke-width="8" fill="none"/>
  <path d="M60 46 V60 H74" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="105" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="38" fill="#FFFFFF" letter-spacing="-0.5">GCash</text>
</svg>''',

    # SEPA Instant / Single Euro Payments Area
    "sepa": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#002B49"/>
  <!-- SEPA Stars Arc -->
  <circle cx="50" cy="60" r="24" fill="none" stroke="#FFCC00" stroke-width="2" stroke-dasharray="4 8"/>
  <text x="90" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" letter-spacing="2">SEPA</text>
  <rect x="90" y="76" width="60" height="18" rx="4" fill="#FFCC00"/>
  <text x="120" y="89" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="10" fill="#002B49">INSTANT</text>
</svg>''',

    # Czech Bank / QR Platba Badge
    "cz-bank": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#11457E"/>
  <rect x="25" y="30" width="60" height="60" rx="10" fill="#1E5FA8" stroke="#ffffff" stroke-opacity="0.2"/>
  <!-- QR Platba Symbol -->
  <path d="M40 45 H70 V75 H40 Z" fill="none" stroke="#FFFFFF" stroke-width="3"/>
  <rect x="48" y="53" width="12" height="12" fill="#D7141A"/>
  <text x="100" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">Česká banka</text>
  <text x="100" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="13" fill="#A0C4FF">QR Platba · Převod CZK</text>
</svg>''',

    # Indian Bank Transfer (IMPS / NEFT)
    "in-bank": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#121824"/>
  <path d="M35 75 H75 V70 H35 V75 Z M35 45 L55 35 L75 45 V50 H35 V45 Z M40 53 H46 V67 H40 V53 Z M52 53 H58 V67 H52 V53 Z M64 53 H70 V67 H64 V53 Z" fill="#FF9933"/>
  <text x="92" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">Indian Bank Transfer</text>
  <text x="92" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#138808">IMPS / NEFT Instant Payout</text>
</svg>''',

    # Philippine Bank Transfer (InstaPay / PESONet)
    "ph-bank": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#0A192F"/>
  <circle cx="50" cy="60" r="22" fill="#0038A8"/>
  <path d="M42 60 L50 52 L58 60 M50 52 V68" stroke="#FCD116" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="88" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">PH Bank Transfer</text>
  <text x="88" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#CE1126">InstaPay &amp; PESONet</text>
</svg>''',

    # International SWIFT / Wire
    "int-bank": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" fill="none">
  <rect width="300" height="120" rx="16" fill="#181E2A"/>
  <circle cx="50" cy="60" r="24" stroke="#3B82F6" stroke-width="3" fill="none"/>
  <ellipse cx="50" cy="60" rx="12" ry="24" stroke="#3B82F6" stroke-width="2" fill="none"/>
  <line x1="26" y1="60" x2="74" y2="60" stroke="#3B82F6" stroke-width="2"/>
  <text x="90" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">International Wire</text>
  <text x="90" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12" fill="#94A3B8">SWIFT · Global Transfer</text>
</svg>'''
}

for name, svg in PAYMENT_METHODS.items():
    write_file(f"public/assets/payment-methods/{name}.svg", svg)


# Gift Card Artwork SVGs (3:2 Ratio Realistic Cards)
GIFT_CARDS = {
    "amazon": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <rect width="400" height="250" rx="18" fill="#131921"/>
  <rect x="1" y="1" width="398" height="248" rx="17" stroke="#ffffff" stroke-opacity="0.1" fill="none"/>
  <!-- Amazon Brand Elements -->
  <text x="40" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="32" fill="#FFFFFF">amazon</text>
  <path d="M42 100 Q 110 125 180 98" stroke="#FF9900" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M172 90 L185 98 L175 108" fill="#FF9900"/>

  <rect x="40" y="170" width="120" height="36" rx="8" fill="#FF9900"/>
  <text x="100" y="193" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" fill="#131921">GIFT CARD</text>
  <text x="360" y="200" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="14" fill="#99A9B9">Moonlight Verified</text>
</svg>''',

    "apple": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <defs>
    <linearGradient id="appleG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="18" fill="#0F0F12"/>
  <rect x="15" y="15" width="370" height="220" rx="14" fill="url(#appleG)" opacity="0.15"/>
  <!-- Apple Logo -->
  <g transform="translate(170, 70) scale(1.5)">
    <path d="M 15.2 8.4 C 15.2 5.5 17.6 4.1 17.7 4.0 C 16.3 2.0 14.1 1.7 13.4 1.6 C 11.6 1.4 9.8 2.7 8.9 2.7 C 7.9 2.7 6.5 1.6 5.0 1.6 C 3.1 1.6 1.4 2.7 0.5 4.3 C -1.4 7.6 0.0 12.5 1.8 15.1 C 2.7 16.4 3.7 17.8 5.1 17.7 C 6.5 17.6 7.1 16.8 8.7 16.8 C 10.3 16.8 10.8 17.7 12.2 17.7 C 13.7 17.7 14.6 16.4 15.5 15.1 C 16.5 13.6 17.0 12.2 17.0 12.1 C 16.9 12.0 15.2 11.3 15.2 8.4 Z" fill="#FFFFFF"/>
    <path d="M 11.6 0 C 12.4 -1.0 12.9 -2.3 12.7 -3.7 C 11.5 -3.6 10.0 -2.8 9.2 -1.8 C 8.5 -1.0 7.9 0.4 8.1 1.8 C 9.5 1.9 10.8 1.1 11.6 0 Z" fill="#FFFFFF"/>
  </g>
  <text x="200" y="165" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="18" fill="#FFFFFF" letter-spacing="1">Apple Gift Card</text>
  <text x="200" y="190" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="12" fill="#A1A1AA">For everything Apple</text>
</svg>''',

    "google-play": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <rect width="400" height="250" rx="18" fill="#121318"/>
  <!-- Play Icon -->
  <g transform="translate(50, 75)">
    <path d="M 0 0 L 50 30 L 0 60 Z" fill="#00E676"/>
    <path d="M 0 0 L 35 35 L 0 60 Z" fill="#00B0FF"/>
    <path d="M 0 0 L 35 18 L 50 30 Z" fill="#FF3D00"/>
    <path d="M 0 60 L 35 42 L 50 30 Z" fill="#FFC107"/>
  </g>
  <text x="130" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="28" fill="#FFFFFF">Google Play</text>
  <text x="130" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="13" fill="#9CA3AF">Apps, games, movies &amp; books</text>

  <rect x="50" y="175" width="300" height="1" fill="#262833"/>
  <text x="50" y="202" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#00E676">Instant Digital Delivery</text>
</svg>''',

    "steam": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <defs>
    <linearGradient id="steamG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#171a21"/>
      <stop offset="100%" stop-color="#1b2838"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="18" fill="url(#steamG)"/>
  <circle cx="200" cy="100" r="45" fill="none" stroke="#66c0f4" stroke-width="8"/>
  <circle cx="180" cy="115" r="18" fill="#66c0f4"/>
  <path d="M120 160 L170 120" stroke="#66c0f4" stroke-width="12" stroke-linecap="round"/>
  <text x="200" y="180" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="26" fill="#FFFFFF" letter-spacing="2">STEAM</text>
  <text x="200" y="202" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12" fill="#c6d4df">Wallet Code · PC Gaming</text>
</svg>''',

    "playstation": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <rect width="400" height="250" rx="18" fill="#003791"/>
  <g transform="translate(170, 50) scale(1.2)">
    <path d="M25 10 C35 10 40 18 40 28 C40 38 32 45 20 45 L20 60 L10 60 L10 10 Z" fill="#FFFFFF"/>
    <path d="M20 20 L20 35 C27 35 30 32 30 27 C30 22 26 20 20 20 Z" fill="#003791"/>
  </g>
  <text x="200" y="160" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="22" fill="#FFFFFF" letter-spacing="1">PlayStation Store</text>
  <text x="200" y="185" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12" fill="#93C5FD">PSN Network Voucher</text>
</svg>''',

    "xbox": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <rect width="400" height="250" rx="18" fill="#107C41"/>
  <circle cx="200" cy="100" r="42" fill="#107C41" stroke="#FFFFFF" stroke-width="4"/>
  <path d="M175 75 C185 88 195 110 200 120 C205 110 215 88 225 75 C212 70 188 70 175 75 Z" fill="#FFFFFF"/>
  <path d="M165 110 C178 112 190 116 200 120 C188 122 172 125 160 120 Z" fill="#FFFFFF"/>
  <path d="M235 110 C222 112 210 116 200 120 C212 122 228 125 240 120 Z" fill="#FFFFFF"/>
  <text x="200" y="175" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="24" fill="#FFFFFF" letter-spacing="1">XBOX</text>
  <text x="200" y="198" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12" fill="#A7F3D0">Digital Game Pass &amp; Gift Card</text>
</svg>''',

    # Custom Moonlight Original Luxury & Lifestyle Cards
    "luxury-lifestyle": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <defs>
    <linearGradient id="luxG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1D24"/>
      <stop offset="50%" stop-color="#2A2F3D"/>
      <stop offset="100%" stop-color="#111318"/>
    </linearGradient>
    <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="18" fill="url(#luxG)"/>
  <rect x="1" y="1" width="398" height="248" rx="17" stroke="url(#goldG)" stroke-width="1.5" stroke-opacity="0.6" fill="none"/>

  <text x="40" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11" fill="#FCD34D" letter-spacing="3">MOONLIGHT PRIVATE</text>
  <text x="40" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="#FFFFFF" letter-spacing="0.5">Luxury &amp; Lifestyle</text>
  <text x="40" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="13" fill="#9CA3AF">Fine Watches · Designer Fashion · Concierge</text>

  <rect x="40" y="175" width="140" height="34" rx="17" fill="url(#goldG)"/>
  <text x="110" y="196" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="12" fill="#111318">ELEVATED</text>
</svg>''',

    "shopping": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <rect width="400" height="250" rx="18" fill="#18181B"/>
  <rect x="1" y="1" width="398" height="248" rx="17" stroke="#3F3F46" stroke-width="1" fill="none"/>
  <text x="40" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#A1A1AA" letter-spacing="2">MOONLIGHT CARD</text>
  <text x="40" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="#FFFFFF">Global Shopping</text>
  <text x="40" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="13" fill="#71717A">European Boutiques &amp; Premium Retail</text>

  <circle cx="340" cy="185" r="22" fill="#27272A" stroke="#3F3F46"/>
  <path d="M332 185 H348 M340 177 V193" stroke="#FFFFFF" stroke-width="2"/>
</svg>''',

    "entertainment": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <defs>
    <linearGradient id="entG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#31103F"/>
      <stop offset="100%" stop-color="#0F0814"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="18" fill="url(#entG)"/>
  <rect x="1" y="1" width="398" height="248" rx="17" stroke="#A855F7" stroke-dasharray="4 4" stroke-opacity="0.4" fill="none"/>
  <text x="40" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#C084FC" letter-spacing="2">MOONLIGHT ENTERTAINMENT</text>
  <text x="40" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="#FFFFFF">Media &amp; Streaming</text>
  <text x="40" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="13" fill="#A1A1AA">Cinema · Music · Premium Digital Subscriptions</text>
</svg>''',

    "travel": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" fill="none">
  <defs>
    <linearGradient id="trvG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F2B48"/>
      <stop offset="100%" stop-color="#071524"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="18" fill="url(#trvG)"/>
  <text x="40" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#38BDF8" letter-spacing="2">MOONLIGHT ESCAPES</text>
  <text x="40" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="#FFFFFF">Fine Travel &amp; Hotels</text>
  <text x="40" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="13" fill="#94A3B8">Luxury Resorts · Global Flights · Stays</text>
</svg>'''
}

for name, svg in GIFT_CARDS.items():
    write_file(f"public/assets/gift-cards/{name}.svg", svg)


# Investment & Premium Lifestyle Visuals
INVESTMENTS = {
    "global-markets": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" fill="none">
  <rect width="600" height="350" rx="24" fill="#0D1117"/>
  <rect x="1" y="1" width="598" height="348" rx="23" stroke="#21262D" fill="none"/>
  <!-- Chart Lines -->
  <path d="M40 260 Q 120 220 200 240 T 360 140 T 520 80" fill="none" stroke="#22C55E" stroke-width="4" stroke-linecap="round"/>
  <path d="M40 260 Q 120 220 200 240 T 360 140 T 520 80 L 520 310 L 40 310 Z" fill="none"/>

  <circle cx="520" cy="80" r="8" fill="#22C55E"/>
  <circle cx="520" cy="80" r="16" fill="#22C55E" opacity="0.3"/>

  <text x="40" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="12" fill="#8B949E" letter-spacing="3">EUROPEAN &amp; GLOBAL MARKETS</text>
  <text x="40" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="28" fill="#FFFFFF">Wealth &amp; Portfolio Growth</text>
  <text x="40" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="14" fill="#3FB950">+12.4% European Indices YTD</text>
</svg>''',

    "wealth-management": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" fill="none">
  <rect width="600" height="350" rx="24" fill="#161B22"/>
  <rect x="1" y="1" width="598" height="348" rx="23" stroke="#30363D" fill="none"/>
  <circle cx="480" cy="175" r="110" fill="none" stroke="#30363D" stroke-width="2"/>
  <circle cx="480" cy="175" r="80" fill="none" stroke="#58A6FF" stroke-width="12" stroke-dasharray="320 180"/>
  <circle cx="480" cy="175" r="80" fill="none" stroke="#238636" stroke-width="12" stroke-dasharray="120 380" stroke-dashoffset="-320"/>

  <text x="50" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="12" fill="#8B949E" letter-spacing="3">PRIVATE BANKING STANDARD</text>
  <text x="50" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="28" fill="#FFFFFF">Automated Asset Allocation</text>
  <text x="50" y="140" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="15" fill="#C9D1D9">Multi-currency treasury accounts with instant liquidity.</text>
</svg>'''
}

for name, svg in INVESTMENTS.items():
    write_file(f"public/assets/investments/{name}.svg", svg)

print("All visual assets created successfully in public/assets/!")
