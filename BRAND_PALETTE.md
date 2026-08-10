# M310 Renovations — Brand Palette (v2, replaces orange/black)

## Primary — Deep Navy Blue (trust, quality, calm authority)
- **Main:** #1B2A4E (deep navy, headers/nav/backgrounds)
- **Dark:** #0F1B36 (footer, hero overlays)
- **Light:** #2C4074 (hover states, secondary buttons)

## Accent — Antique/Champagne Gold (premium, warm, aspirational)
- **Main:** #B08D57 (CTAs, price numbers, dividers)
- **Bright:** #C9A66B (hover states)
- **Dark:** #8B6F42 (pressed states, text on cream)

## Neutrals — Warm & Refined
- **Cream (light bg):** #FAF7F0 (page background)
- **Warm White:** #FFFFFF (cards)
- **Warm Gray Text:** #3A3833 (body text)
- **Muted Gray Text:** #6B6862 (secondary text)
- **Divider:** #E5DFD3

## Usage rules
- Navy is the primary hero/nav/background color
- Gold is used SPARINGLY — CTAs, key numbers (uplift $$$), accent lines only
- No orange, no bright red, no black-on-white harsh contrast
- Cream/warm-white replaces bright white for a softer, more premium feel
- All shadows should be very subtle and warm-toned

## Tailwind swap plan
Replace across every HTML file:
- `#F26B1F` (old orange) → `#B08D57` (gold) for CTAs
- `bg-black` / `#000` → `#1B2A4E` (navy) for headers/dark sections
- `text-orange-500` → `text-[#B08D57]` (gold)
- White backgrounds → `#FAF7F0` (cream)
- Border blacks → `#E5DFD3` (soft divider)
