#!/bin/bash
# M310 Renovations — Meta Pixel ID swap helper
# Usage: ./swap_pixel.sh 1234567890123456
# Replaces PIXEL_ID_HERE with your actual Meta Pixel ID across all 11 HTML pages.

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Missing Pixel ID"
  echo "Usage: ./swap_pixel.sh <YOUR_PIXEL_ID>"
  echo "Example: ./swap_pixel.sh 1234567890123456"
  exit 1
fi

PIXEL_ID="$1"

# Validate: Meta Pixel IDs are 15-16 digit numbers
if ! [[ "$PIXEL_ID" =~ ^[0-9]{15,16}$ ]]; then
  echo "⚠️  Warning: '$PIXEL_ID' doesn't look like a Meta Pixel ID (should be 15-16 digits)."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 Files to update:"
grep -l "PIXEL_ID_HERE" *.html || { echo "❌ No files with PIXEL_ID_HERE placeholder found."; exit 1; }

echo ""
echo "🔄 Swapping PIXEL_ID_HERE → $PIXEL_ID..."
sed -i.bak "s/PIXEL_ID_HERE/$PIXEL_ID/g" *.html

# Cleanup .bak files
rm -f *.html.bak

echo ""
echo "✅ Verification:"
remaining=$(grep -l "PIXEL_ID_HERE" *.html 2>/dev/null | wc -l)
updated=$(grep -l "$PIXEL_ID" *.html 2>/dev/null | wc -l)
echo "   Files still with placeholder: $remaining (should be 0)"
echo "   Files with new Pixel ID:      $updated (should be 11)"

if [ "$remaining" -eq 0 ] && [ "$updated" -eq 11 ]; then
  echo ""
  echo "🎉 Done! Meta Pixel ID $PIXEL_ID is now live on all 11 pages."
  echo ""
  echo "Next steps:"
  echo "  1. Redeploy: cd .. && vercel deploy --prod --yes"
  echo "  2. Test: Install Meta Pixel Helper Chrome extension, visit https://m310renovations.com"
  echo "  3. Verify PageView + Contact + Lead events in Meta Events Manager"
else
  echo "❌ Something went wrong — check output above."
  exit 1
fi
