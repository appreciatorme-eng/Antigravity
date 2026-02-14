# Stitch Design References

This folder stores exported UX references from Google Stitch, providing a stable, versioned source of truth for Travel Suite mobile app implementation.

## 📁 Directory Structure

```
stitch/
├── README.md                           # This file
├── DESIGN_IMPLEMENTATION_SPEC.md       # Detailed design specifications
├── IMPLEMENTATION_SUMMARY.md           # Implementation status and guidelines
└── 15964200879465447191/               # Stitch project exports
    ├── auth_portal.png                 # Login screen screenshot
    ├── auth_portal.html                # Login screen HTML/CSS
    ├── traveler_dashboard.png          # Traveler dashboard screenshot
    ├── traveler_dashboard.html         # Traveler dashboard HTML/CSS
    ├── driver_command.png              # Driver interface screenshot
    ├── driver_command.html             # Driver interface HTML/CSS
    ├── itinerary_timeline.png          # Timeline view screenshot
    ├── itinerary_timeline.html         # Timeline view HTML/CSS
    └── fetch.sh                        # Asset refresh script
```

## 🎨 Stitch Project

**Project URL:** https://stitch.withgoogle.com/projects/15964200879465447191

This project contains the premium "Soft Glass" design system for Travel Suite, featuring:
- Glassmorphism card effects
- Mint (#00D084) and Deep Blue (#124EA2) color palette
- Cormorant Garamond + Poppins typography
- Mobile-first responsive layouts

## 📖 Documentation

### Quick Reference
- **Design Tokens & Specs:** `DESIGN_IMPLEMENTATION_SPEC.md`
- **Implementation Status:** `IMPLEMENTATION_SUMMARY.md`
- **Visual References:** `15964200879465447191/*.png`
- **Exact CSS Values:** `15964200879465447191/*.html`

### For Designers
1. View PNG screenshots for visual reference
2. Access Stitch project for live editing
3. Export updated designs using `fetch.sh`

### For Developers
1. Read `DESIGN_IMPLEMENTATION_SPEC.md` for component specifications
2. Extract exact values (colors, spacing) from HTML files
3. Compare Flutter implementation with PNG screenshots
4. Use `app_theme.dart` as single source of truth for colors/typography

## 🔄 Refreshing Design Assets

When Stitch designs are updated:

```bash
cd projects/travel-suite/docs/stitch/15964200879465447191
./fetch.sh
```

This script re-downloads all PNG and HTML exports from the Stitch project.

**After refresh:**
1. Review changes in PNG screenshots
2. Update `DESIGN_IMPLEMENTATION_SPEC.md` if design tokens changed
3. Update Flutter components to match new designs
4. Commit updated assets with descriptive message

## 🎯 Current Screens

| Screen | Stitch Design | Flutter Implementation |
|--------|---------------|------------------------|
| **Auth Portal** | `auth_portal.png` | `lib/features/auth/presentation/screens/auth_screen.dart` |
| **Traveler Dashboard** | `traveler_dashboard.png` | `lib/features/trips/presentation/widgets/traveler_dashboard.dart` |
| **Driver Command** | `driver_command.png` | `lib/features/trips/presentation/widgets/driver_dashboard.dart` |
| **Itinerary Timeline** | `itinerary_timeline.png` | `lib/features/trips/presentation/screens/trip_detail_screen.dart` |

## 🔑 Key Design Principles

1. **Glassmorphism**
   - Semi-transparent card backgrounds
   - Backdrop blur effects
   - Subtle borders and shadows

2. **Color Usage**
   - Mint (#00D084): Primary actions, active states
   - Deep Blue (#124EA2): Text, headers, secondary actions
   - Soft gradients for backgrounds

3. **Typography**
   - Cormorant Garamond: Display text, large numbers
   - Poppins: Body text, buttons, labels

4. **Spacing**
   - 24px border radius (primary cards)
   - 16-20px internal padding
   - 12-16px gaps between elements

## 🛠️ Using Design References

### Extract Color Values
```bash
# Search HTML for specific color
grep -i "00D084" 15964200879465447191/*.html

# Extract all hex colors
grep -oE '#[0-9A-Fa-f]{6}' 15964200879465447191/auth_portal.html
```

### Compare Spacing
1. Open PNG screenshot
2. Use measuring tool (Figma, Sketch, etc.)
3. Verify against 8px grid
4. Match in Flutter (logical pixels)

### Extract CSS Properties
Open HTML files in browser or code editor to see:
- Exact color values
- Font sizes and weights
- Border radius values
- Padding/margin spacing
- Shadow parameters

## ✅ Implementation Checklist

- [x] Design assets extracted and stored
- [x] Design specification documented
- [x] Implementation summary created
- [x] Theme tokens aligned with Stitch
- [ ] Auth portal animations enhanced
- [ ] Dashboard layout refinements
- [ ] Timeline date selector implemented
- [ ] Visual regression testing complete

## 📝 Change Log

### 2026-02-14
- Initial Stitch design extraction
- Created comprehensive documentation
- Stored all visual and code references
- Documented current implementation status

---

**Maintained By:** Travel Suite Development Team
**Last Updated:** February 14, 2026
**Design System:** Soft Glass Premium (Stitch)

