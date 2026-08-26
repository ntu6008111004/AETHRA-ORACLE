# AETHRA ORACLE (เอธรา ออราเคิล)
> **Many traditions. One personal reading.**  
> *หลากศาสตร์พยากรณ์ หนึ่งคำอ่านที่เป็นของคุณ*

A luxury celestial observatory and multi-tradition personal divination platform. Built with zero runtime dependencies, pure procedural audio synthesis, deterministic celestial seal geometry, and mathematical calculation engines for Western Astrology, Thai Suriyayart, Vedic Jyotish, BaZi (Four Pillars of Destiny), Numerology, 78-Card Tarot Arcana, and 64-Hexagram I Ching.

---

## 1. Brand Identity & Aesthetic Concept

The brand identity of **AETHRA ORACLE** balances seven distinct aesthetic dimensions:
1. **Private Observatory**: Deep midnight space, precision celestial coordinate rings, planetary axes, and astrolabes.
2. **Ancient Celestial Manuscript**: Refined typography, aged gold leaf accents, parchment warmth, and scholarly dignity.
3. **Luxury Editorial**: Generous whitespace, refined typographic contrast (*Cinzel Decorative* + *Cormorant Garamond* + *Plus Jakarta Sans* + *Sarabun*), and intentional alignment.
4. **Astronomical Instrument**: Nested brass/gold meridian rings, ecliptic arcs, and cardinal tick nodes.
5. **Fine Jewelry**: Restrained micro-bead accents, obsidian contrast, and gold foil detailing.
6. **Quiet Mysticism**: Philosophical depth, contemplative inquiry, and respectful boundary definitions.
7. **Modern Digital Product**: 60fps canvas parallax, responsive layouts from 320px to 2560px, Web Audio synthesizer, and standalone PWA support.

---

## 2. Design Tokens (`css/tokens.css`)

### Color Palette
- **Obsidian Deep Space**: `#0C0D10` (Surface Base)
- **Charcoal Navy**: `#13151D` (Surface Elevated)
- **Slate Panel**: `#181B26` (Surface Panel)
- **Antique Gold Light**: `#F2DFAB`
- **Antique Gold Primary**: `#C5A059`
- **Antique Gold Deep**: `#8F6E32`
- **Antique Gold Bright**: `#E5C378`
- **Warm Ivory**: `#F5F2EB` (Primary Text)
- **Cool Silver-Grey**: `#C8CDD6` (Secondary Text)
- **Astrolabe Muted**: `#838A99` (Muted Callouts)

### Tradition Accents
- **Western Astrology**: `#C5A059` (Observatory Gold)
- **Thai Suriyayart**: `#D4AF37` (Thai Gold Leaf)
- **Vedic Jyotish**: `#4361EE` (Cosmic Indigo)
- **BaZi Four Pillars**: `#B02A37` (Vermilion Cinnabar) & `#2E6F62` (Jade)
- **Numerology**: `#9A8C98` (Architectural Silver)
- **Tarot**: `#D4AF37` (Velvet Gold Foil)
- **I Ching**: `#C59B27` (Bronze Coin)

---

## 3. Brand Asset Architecture

```text
/
├── index.html                           # Semantic root document with complete SEO & Open Graph
├── 404.html                             # Celestial 404 page ("This path is not written in the stars")
├── manifest.webmanifest                 # Standalone PWA manifest
├── robots.txt                           # Search engine crawling rules
├── package.json                         # Build & test scripts
│
├── assets/
│   ├── brand/
│   │   ├── logo-full-dark.svg           # Full lockup on Obsidian
│   │   ├── logo-full-light.svg          # Full lockup on Parchment
│   │   ├── logo-symbol-dark.svg         # Concentric celestial astrolabe mark (Dark)
│   │   ├── logo-symbol-light.svg        # Concentric celestial astrolabe mark (Light)
│   │   ├── logo-horizontal-dark.svg     # Header lockup (Dark)
│   │   ├── logo-horizontal-light.svg    # Header lockup (Light)
│   │   ├── logo-monochrome.svg          # Single-color high-contrast vector
│   │   ├── logo-512.png                 # 512x512 raster brand asset
│   │   └── logo-1024.png                # 1024x1024 raster brand asset
│   │
│   ├── icons/
│   │   ├── favicon.svg                  # Vector SVG favicon
│   │   ├── favicon.ico                  # Multi-resolution ICO (16x16, 32x32, 48x48)
│   │   ├── favicon-16x16.png            # 16x16 PNG
│   │   ├── favicon-32x32.png            # 32x32 PNG
│   │   ├── apple-touch-icon.png         # 180x180 iOS touch icon
│   │   ├── android-chrome-192x192.png   # 192x192 Android icon
│   │   └── android-chrome-512x512.png   # 512x512 Android splash icon
│   │
│   ├── social/
│   │   ├── og-aethra-oracle.svg         # 1200x630 Open Graph vector source
│   │   └── og-aethra-oracle.png         # 1200x630 Open Graph preview card
│   │
│   └── audio/
│       ├── ui-select.wav                # Soft harmonic click
│       ├── tarot-shuffle.wav            # Tactile card slide acoustics
│       ├── tarot-flip.wav               # Paper flip snap
│       ├── reading-complete.wav         # Celestial resonant chord (C4-G4-E5-B5)
│       └── iching-coin.wav              # Bronze coin spin ping
│
├── css/
│   ├── tokens.css                       # Color, spacing, typography, motion tokens
│   └── index.css                        # Layouts, navigation, responsive styles
│
├── js/
│   ├── app.js                           # Application router & orchestrator
│   ├── core/
│   │   ├── sound.js                     # Web Audio API engine & SoundManager
│   │   ├── i18n.js                      # Bilingual dictionary (EN / TH)
│   │   └── storage.js                   # Local storage & profile state
│   ├── engines/
│   │   ├── astrology.js                 # Western, Thai Suriyayart, Vedic calculations
│   │   ├── bazi.js                      # Four Pillars & Five Elements balance
│   │   ├── numerology.js                # Pythagorean & Chaldean numbers
│   │   ├── tarot.js                     # 78-card deck & spread drawers
│   │   ├── iching.js                    # 64 hexagrams & coin toss simulation
│   │   └── unified.js                   # Cross-tradition synthesis
│   ├── components/
│   │   ├── astrolabe.js                 # Interactive 2D canvas astrolabe
│   │   ├── seal.js                      # Deterministic personal celestial seal
│   │   ├── navigation.js                # Sticky header & mobile drawer
│   │   └── toast.js                     # Accessible notifications
│   └── views/
│       ├── dashboard.js                 # Daily dynamic energy & traditions grid
│       ├── traditions.js                # Multi-tradition charts
│       ├── tarot-view.js                # 3-card spread room
│       ├── iching-view.js               # Bronze coin tossing arena
│       ├── unified-view.js              # Synthesis report
│       ├── consultation.js              # Editorial conversation sanctuary
│       └── profile.js                   # Profile manager & seal canvas
│
├── scripts/
│   ├── generate-assets.js               # Asset rasterization & audio generator
│   └── server.js                        # Lightweight static test server
│
└── tests/
    └── test-suite.js                    # Automated unit & asset verification
```

---

## 4. How to Generate / Regenerate Assets

To rebuild all PNG favicons, iOS/Android icons, high-res logos, the 1200×630 Open Graph card, and procedural PCM audio assets:

```bash
npm run generate-assets
```

---

## 5. How to Run Automated Tests

To execute the 37-point test suite verifying calculations, deterministic seeds, storage, and asset integrity:

```bash
npm test
```

---

## 6. How to Run the Local Dev Server

```bash
node scripts/server.js
```
Then open `http://localhost:3000` in your web browser.

---

## 7. Ethical Foundation & Disclaimer

**AETHRA ORACLE** is engineered as a digital sanctuary for contemplation, philosophical reflection, and creative self-inquiry. Divination readings must never replace licensed medical diagnosis, legal counsel, or certified professional financial advice.
