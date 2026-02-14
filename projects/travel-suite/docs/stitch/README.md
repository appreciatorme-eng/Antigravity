# Stitch Design References

This folder stores exported UX references from Google Stitch, providing a stable, versioned source of truth for Travel Suite mobile app implementation.

## 📁 Directory Structure

```
stitch/
├── README.md                           # This file
├── DESIGN_INVENTORY.md                 # Complete catalog of all 25 designs
├── DESIGN_IMPLEMENTATION_SPEC.md       # Detailed design specifications
├── IMPLEMENTATION_SUMMARY.md           # Implementation status and guidelines
└── 15964200879465447191/               # Stitch project exports (25 designs)
    ├── *.png                           # Visual reference screenshots
    ├── *.html                          # HTML/CSS exports with exact values
    └── fetch.sh                        # Asset refresh script
```

## 🎨 Stitch Project

**Project URL:** https://stitch.withgoogle.com/projects/15964200879465447191
**Total Designs:** 25 screens

This project contains the premium "Soft Glass" design system for Travel Suite, featuring:
- Glassmorphism card effects with backdrop blur
- Mint (#00D084) and Deep Blue (#124EA2) color palette
- Cormorant Garamond + Poppins typography
- Animated mascot character "Aero" in multiple states
- Dark mode variants for all core screens
- Mobile-first responsive layouts

## 📖 Documentation

### Quick Reference
- **Complete Design Catalog:** `DESIGN_INVENTORY.md` (all 25 screens organized by category)
- **Design Tokens & Specs:** `DESIGN_IMPLEMENTATION_SPEC.md`
- **Implementation Status:** `IMPLEMENTATION_SUMMARY.md`
- **Visual References:** `15964200879465447191/*.png`
- **Exact CSS Values:** `15964200879465447191/*.html`

### For Designers
1. View PNG screenshots for visual reference
2. Access Stitch project for live editing
3. Export updated designs using `fetch.sh` or manual export
4. Consult `DESIGN_INVENTORY.md` for complete screen catalog

### For Developers
1. Read `DESIGN_INVENTORY.md` to understand all available designs
2. Read `DESIGN_IMPLEMENTATION_SPEC.md` for component specifications
3. Extract exact values (colors, spacing) from HTML files
4. Compare Flutter implementation with PNG screenshots
5. Use `app_theme.dart` as single source of truth for colors/typography
6. Prioritize implementation using the priority matrix in `DESIGN_INVENTORY.md`

## 🔄 Refreshing Design Assets

When Stitch designs are updated:

```bash
cd projects/travel-suite/docs/stitch/15964200879465447191
./fetch.sh
```

This script re-downloads the 4 original core designs. For all 25 designs, export manually from Stitch:
1. Visit https://stitch.withgoogle.com/projects/15964200879465447191
2. Click 'Export' or 'Download'
3. Select 'Export All Screens'
4. Download and extract zip file
5. Replace files in `15964200879465447191/` directory

**After refresh:**
1. Review changes in PNG screenshots
2. Update `DESIGN_IMPLEMENTATION_SPEC.md` if design tokens changed
3. Update Flutter components to match new designs
4. Commit updated assets with descriptive message

## 🎯 Design Categories (25 Total)

### Core Screens (Light Mode) - 4 designs
Primary application screens in standard light theme.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Auth Portal | `auth_portal.png` | 80% done | High |
| Traveler Dashboard | `traveler_dashboard.png` | 70% done | High |
| Driver Command | `driver_command.png` | 75% done | High |
| Itinerary Timeline | `itinerary_timeline.png` | 60% done | High |

### Dark Mode Variants - 4 designs
Dark theme alternatives for all core screens.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Auth Portal (Dark) | `auth_portal-dark_mode.png` | Not started | Medium |
| Traveler Dashboard (Dark) | `traveler_dashboard-dark_mode.png` | Not started | Medium |
| Driver Command (Dark) | `driver_command-dark_mode.png` | Not started | Medium |
| Itinerary (Dark) | `itinerary-dark_mode.png` | Not started | Medium |

### Traveler Home Variants - 3 designs
Alternative home screen layouts with different mascot states.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Calm Aero | `traveler_home-calm_aero_variant.png` | Not started | Low |
| Gliding Aero | `traveler_home-gliding_aero_variant.png` | Not started | Low |
| Resting Mascot | `traveler_home-resting_mascot_variant.png` | Not started | Low |

### Driver Hub Variants - 3 designs
Alternative driver interface layouts with mascot states.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Focused Aero | `driver_command-focused_aero_variant.png` | Not started | Medium |
| Active Mascot | `driver_hub-active_mascot_variant.png` | Not started | Low |
| Hovering Aero | `driver_hub-hovering_aero_variant.png` | Not started | Low |

### Operator/Admin Panels - 4 designs
Admin and operator interfaces for fleet management.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Flight Monitor | `operator_flight_monitor.png` | Not started | High |
| Overseer Aero | `operator_monitor-overseer_aero_variant.png` | Not started | Medium |
| Overseer Mascot | `operator_panel-overseer_mascot_variant.png` | Not started | Medium |
| Vigilant Aero | `operator_panel-vigilant_aero_variant.png` | Not started | Medium |

### Animations & Interactions - 4 designs
Animated screens and interaction states.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Success Animation | `aero_success_animation_screen.png` | Not started | Medium |
| Syncing Animation | `aero_syncing_flight_data_animation.png` | Not started | Medium |
| Flutter Tooltip | `mascot_tap-flutter_&_tooltip_interaction.png` | Not started | Low |
| Spin Ripple | `mascot_tap-spin_&_ripple_interaction.png` | Not started | Low |

### Overlays & Transitions - 2 designs
Modal overlays and transition states.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Notification Overlay | `soft_glass_notification_overlay.png` | Not started | High |
| Card Expansion | `transition_state-flight_card_expansion.png` | Not started | Medium |

### Loading Screens - 1 design
Initial loading and splash screens.

| Screen | File | Status | Priority |
|--------|------|--------|----------|
| Initial Loading | `initial_loading_screen_with_aero_mascot.png` | Not started | High |

## 🗺️ Flutter Implementation Map

| Stitch Design | Flutter File | Status |
|---------------|--------------|--------|
| `auth_portal.png` | `lib/features/auth/presentation/screens/auth_screen.dart` | 80% |
| `traveler_dashboard.png` | `lib/features/trips/presentation/widgets/traveler_dashboard.dart` | 70% |
| `driver_command.png` | `lib/features/trips/presentation/widgets/driver_dashboard.dart` | 75% |
| `itinerary_timeline.png` | `lib/features/trips/presentation/screens/trip_detail_screen.dart` | 60% |
| Dark mode variants | `lib/core/theme/app_theme.dart` + theme switching | 0% |
| Operator panels | `apps/web/` (admin panel, not mobile yet) | N/A |
| Loading screen | `lib/main.dart` (splash screen) | 0% |
| Notification overlay | `lib/core/ui/components/` (to be created) | 0% |
| Animations | `lib/core/ui/animations/` (to be created) | 0% |

## 🔑 Key Design Principles

1. **Glassmorphism**
   - Semi-transparent card backgrounds: `rgba(255,255,255,0.65)`
   - Backdrop blur effects: 16-24px
   - Subtle borders: `rgba(255,255,255,0.60)`
   - Soft shadows: low opacity (0.1-0.15)

2. **Color Usage**
   - Mint (#00D084): Primary actions, active states, success
   - Deep Blue (#124EA2): Text, headers, secondary actions
   - Muted Gray (#6B7280): Secondary text, disabled states
   - Soft gradients for backgrounds

3. **Typography**
   - Cormorant Garamond: Display text (32-44px), large numbers
   - Poppins: Body text (14-16px), buttons, labels (11-12px)
   - Clear weight hierarchy: 400 (regular), 600 (semibold), 700 (bold)

4. **Spacing**
   - 8px grid system
   - 24px border radius (primary cards)
   - 16-20px internal padding
   - 12-16px gaps between elements

5. **Mascot "Aero"**
   - Animated character throughout the app
   - Multiple states: calm, gliding, resting, active, hovering, vigilant, overseer
   - Provides personality and engagement
   - Interactive tap states with flutter and ripple effects

## 🛠️ Using Design References

### Extract Color Values
```bash
# Search HTML for specific color
grep -i "00D084" 15964200879465447191/*.html

# Extract all hex colors from a file
grep -oE '#[0-9A-Fa-f]{6}' 15964200879465447191/auth_portal.html

# Find all glass surface colors
grep -i "rgba.*255.*255.*255" 15964200879465447191/*.html
```

### Compare Spacing
1. Open PNG screenshot
2. Use measuring tool (Figma, Sketch, etc.)
3. Verify against 8px grid
4. Match in Flutter (logical pixels)

### Extract CSS Properties
Open HTML files in browser or code editor to see:
- Exact color values (hex and rgba)
- Font sizes and weights
- Border radius values
- Padding/margin spacing
- Shadow parameters (blur, spread, opacity)
- Backdrop filter blur amounts

### View All Designs
```bash
# List all PNG files
ls -1 15964200879465447191/*.png

# Count total designs
ls -1 15964200879465447191/*.png | wc -l

# View specific category
ls -1 15964200879465447191/*dark_mode*.png
ls -1 15964200879465447191/operator*.png
ls -1 15964200879465447191/*aero*.png
```

## ✅ Implementation Checklist

### Phase 1: Core (MVP)
- [x] Design assets extracted and stored (25 designs)
- [x] Design specification documented
- [x] Design inventory created
- [x] Implementation summary created
- [x] Theme tokens aligned with Stitch
- [ ] Auth portal animations enhanced
- [ ] Dashboard layout refinements
- [ ] Timeline date selector implemented
- [ ] Operator flight monitor implemented (web admin)
- [ ] Initial loading screen implemented
- [ ] Notification overlay component created

### Phase 2: Enhancement
- [ ] Dark mode theme system implemented
- [ ] All 4 dark mode variants implemented
- [ ] Success/syncing animations added
- [ ] Card expansion transition added
- [ ] Focused/Overseer variants explored

### Phase 3: Polish
- [ ] Traveler home variants implemented
- [ ] Driver hub mascot variants added
- [ ] Mascot interaction animations
- [ ] Additional operator variants
- [ ] Visual regression testing complete

## 📝 Change Log

### 2026-02-14 - Expanded Design Library
- Extracted complete Stitch design library (25 screens total)
- Added 21 new designs beyond original 4 core screens
- Created comprehensive design inventory (`DESIGN_INVENTORY.md`)
- Categorized designs into 8 logical groups
- Updated fetch script for all designs
- Documented priority matrix for implementation
- Added mascot "Aero" documentation

### 2026-02-14 - Initial Extraction
- Initial Stitch design extraction (4 core screens)
- Created comprehensive documentation
- Stored all visual and code references
- Documented current implementation status

---

**Maintained By:** Travel Suite Development Team
**Last Updated:** February 14, 2026
**Design System:** Soft Glass Premium (Stitch)
**Total Designs:** 25 screens (4 core + 21 additional)
