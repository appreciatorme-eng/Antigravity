#!/usr/bin/env bash
set -euo pipefail

# Stitch Design Asset Refresh Script
# Project: Travel Suite - Soft Glass Premium
# Stitch URL: https://stitch.withgoogle.com/projects/15964200879465447191

echo "============================================"
echo "Stitch Design Refresh - Travel Suite"
echo "============================================"
echo ""

# Function to download files via curl
fetch(){
  local url="$1"; local out="$2";
  echo "Downloading $out" >&2
  curl -L -sS "$url" -o "$out"
}

# ============================================
# ORIGINAL 4 CORE DESIGNS (with Google URLs)
# ============================================

echo "[1/4] Fetching original core designs..."

# Auth Portal (Light Mode)
fetch "https://lh3.googleusercontent.com/aida/AOfcidUMx9nC7EVXtM1ucWusiL06AwvRitZroKREuQ2bKqpFSNd1ta1dfJ11AiZmy3Ttw8APM2K_ckYR44DDU5kPcDG1mF_4i3dHDyZBqGK-iiHnSYz1q_854f1F6uZmoia4NRqkvX1odGEil7Jao8-OzDoMruJiavunJQjbwM4_j2yFRRjpKc2hrPRLzOU-qxxS-CZlxcmfvbwfmhkcIr-QQcywEvwU3D8yiHTuobn9cgAt1yKCKr1cRc99qB9Y" auth_portal.png
fetch "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I5NzRlOTdiMGYxYjQ4YTFhYjY5ZDM4OTc0YzNiZDVmEgsSBxDzl7vf-AIYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTk2NDIwMDg3OTQ2NTQ0NzE5MQ&filename=&opi=89354086" auth_portal.html

# Traveler Dashboard (Light Mode)
fetch "https://lh3.googleusercontent.com/aida/AOfcidWU9rRSX7kbxoQaYRwUXRFcl8Z_jo5U3Zc7N-_pA9ah1pThLdx6X78uImh6yir4HN_X25lyQK5nIe2JpjVXu-OhaKrORxz0fRmfrhFQBdBZRtx6uKm8qYy8Afgpsyh-ll9C4zMUCRlaCnlVHFM8MtnUPWkf_TY_nwjHrhJ-e5QNLnMnZoOIshhinrIl_vqc5Re_jI2CTXZWRh3hCsBDUUOhZQbxBJXucfy4nG_jT521AXq3iIknjl70xZk" traveler_dashboard.png
fetch "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc1OGY1N2M3Mzc2ODRkYTFhZGRkOTljNTAxYzMyMDI2EgsSBxDzl7vf-AIYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTk2NDIwMDg3OTQ2NTQ0NzE5MQ&filename=&opi=89354086" traveler_dashboard.html

# Itinerary Timeline (Light Mode)
fetch "https://lh3.googleusercontent.com/aida/AOfcidVCTHyZYqq8foFRSnRfWeqyX8hLwYyoKvSsk3uU-K__IbvsYCSO0EwEnnS-2kWF1zF89_C8_zYIGU6jgA2MKgMnvXhMeswi-2-ajm-uH1_qoDOQtnk_RtSTTj5BACbGXFnGnql9hoIw3sgAbSqENqI64NbeCSfl5TlXBoshL3VI3HVaVi2Lzb8dB0cX0fbAeFO-lfYXFSKGD_IyRFTTz0wa4snu5ptakr4lOM3KbYNAHGf1MMOzYkTuv7Q" itinerary_timeline.png
fetch "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2UxZjRkOTU0MGI4ZjQ1YjQ5ODc0MGUyYjlkZGJmOGU2EgsSBxDzl7vf-AIYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTk2NDIwMDg3OTQ2NTQ0NzE5MQ&filename=&opi=89354086" itinerary_timeline.html

# Driver Command (Light Mode)
fetch "https://lh3.googleusercontent.com/aida/AOfcidV_ihcCIgN_Ij5B4yiYPPBICgA8xefi6GELazIewgP6vpD2ygf1Unwr0-GLujYfpYM_8WmjZqMzxpv16v9pewPg74UbxJrjshLZIdaent1DRC9AIqQQQiV3YrRDjFz6gw062KG4-rhtYNG_mwdX_ItE5wXw0mDk-758YS3lKlGq9LOW9zwzBMOo3UBRn27XN6zWxwAXBBvNm5TRe7pNqNBuLbZSWyEGypAVdOx5oSifMYsu84XpdZdEfxRw" driver_command.png
fetch "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk0OWE2YmI3ZGZmNDQ5NmRhNDVlMzFmNTBmMGUyYWRiEgsSBxDzl7vf-AIYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTk2NDIwMDg3OTQ2NTQ0NzE5MQ&filename=&opi=89354086" driver_command.html

echo "✓ Original 4 designs refreshed"
echo ""

# ============================================
# ADDITIONAL DESIGNS (21 more designs)
# ============================================

echo "[2/4] Note: Additional 21 designs were extracted from Stitch exports"
echo "Total designs: 25 (4 core + 21 additional)"
echo ""
echo "Additional designs include:"
echo "  - 4 Dark mode variants"
echo "  - 3 Traveler home variants"
echo "  - 3 Driver hub variants"
echo "  - 4 Operator/admin panels"
echo "  - 4 Animations & interactions"
echo "  - 2 Overlays & transitions"
echo "  - 1 Loading screen"
echo ""
echo "To refresh ALL designs:"
echo "  1. Visit https://stitch.withgoogle.com/projects/15964200879465447191"
echo "  2. Click 'Export' or 'Download'"
echo "  3. Select 'Export All Screens'"
echo "  4. Download zip file"
echo "  5. Extract and replace files in this directory"
echo ""

# ============================================
# VERIFICATION
# ============================================

echo "[3/4] Verifying downloaded files..."

png_count=$(ls -1 *.png 2>/dev/null | wc -l)
html_count=$(ls -1 *.html 2>/dev/null | wc -l)

echo "PNG files: $png_count"
echo "HTML files: $html_count"

if [ "$png_count" -ge 25 ] && [ "$html_count" -ge 25 ]; then
  echo "✓ All design files present"
else
  echo "⚠ Warning: Expected 25 PNG and 25 HTML files"
  echo "  Current: $png_count PNG, $html_count HTML"
fi

echo ""

# ============================================
# SUMMARY
# ============================================

echo "[4/4] Refresh complete!"
echo ""
echo "Design files location: docs/stitch/15964200879465447191/"
echo "Design inventory: docs/stitch/DESIGN_INVENTORY.md"
echo "Implementation spec: docs/stitch/DESIGN_IMPLEMENTATION_SPEC.md"
echo ""
echo "============================================"
