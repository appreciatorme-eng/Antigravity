# Web-Mobile Design System Alignment

## Overview

This document outlines the unified design system across the Travel Suite web and mobile applications, ensuring a cohesive family feel. The design system is based on the **GoBuddy Adventures** brand and implements a **Soft Glass Premium** aesthetic (glassmorphism).

---

## Design Philosophy

### Core Principles

1. **Family Consistency**: Web and mobile apps feel like part of the same ecosystem
2. **Glassmorphism**: Soft, premium glass aesthetic with backdrop blur and transparency
3. **Brand Forward**: Vivid Green (#00D084) and Royal Blue (#124EA2) as brand anchors
4. **Modern Premium**: Clean, minimalist, with subtle depth through shadows and gradients
5. **Mobile-First**: Design system originates from Flutter mobile app, adapted for web

---

## Color System

### Brand Colors

| Color | Hex | Usage | Platform |
|-------|-----|-------|----------|
| **Primary (Vivid Green)** | `#00D084` | CTAs, active states, brand moments | Both |
| Primary Hover | `#00B874` | Hover state for green buttons | Web |
| Primary Light | `#33DDA0` | Light backgrounds, accents | Both |
| **Secondary (Royal Blue)** | `#124EA2` | Text, icons, secondary actions | Both |
| Secondary Hover | `#0F3E85` | Hover state for blue buttons | Web |
| Secondary Light | `#1E5FBD` | Light blue accents | Both |

### Neutrals

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#F5F5F5` | Page background (light mode) |
| Surface | `#FFFFFF` | Card surfaces |
| Text Primary | `#124EA2` | Primary text (Royal Blue) |
| Text Secondary | `#6B7280` | Secondary text (Gray-500) |

### Feedback Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#22C55E` | Success messages, confirmations |
| Error | `#EF4444` | Errors, destructive actions |
| Warning | `#F59E0B` | Warnings, cautions |
| Info | `#3B82F6` | Information, tips |

### Glass Surfaces (with Opacity)

| Surface | Value | Usage |
|---------|-------|-------|
| Glass Surface | `rgba(255, 255, 255, 0.65)` | Cards, panels (65% opacity) |
| Glass Nav Surface | `rgba(255, 255, 255, 0.85)` | Navigation bars (85% opacity) |
| Glass Border | `rgba(255, 255, 255, 0.6)` | Borders on glass elements |

### Dark Mode

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0A2F2A` | Dark teal background |
| Surface | `#0F3A33` | Slightly lighter teal for cards |
| Glass Surface | `rgba(255, 255, 255, 0.2)` | Glass cards (20% opacity) |
| Glass Nav | `rgba(255, 255, 255, 0.25)` | Glass nav (25% opacity) |
| Text Primary | `#FFFFFF` | White text |
| Text Secondary | `#B0B0B0` | Light gray text |

---

## Typography

### Font Families

**Primary (Sans-serif):** Poppins
**Secondary (Serif):** Cormorant Garamond

### Typography Scale (matching mobile)

| Style | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Display Large | Cormorant Garamond | 40px | 700 | Hero titles |
| Display Medium | Cormorant Garamond | 32px | 700 | Page titles |
| Headline Large | Poppins | 24px | 700 | Section titles |
| Headline Medium | Poppins | 20px | 600 | Card titles |
| Title Large | Poppins | 18px | 600 | Sub-headings |
| Title Medium | Poppins | 16px | 500 | Labels |
| Body Large | Poppins | 16px | 400 | Body text |
| Body Medium | Poppins | 14px | 400 | Secondary text |
| Label Large | Poppins | 14px | 600 | Buttons, badges |
| Label Small | Poppins | 11px | 700 | Tags, micro-copy |

### Font Weights

- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Usage Guidelines

- **Headings (h1, h2, h3)**: Use Cormorant Garamond for elegance
- **Body text, UI elements**: Use Poppins for clarity and readability
- **ALL CAPS labels**: Use 11px Poppins Bold with letter-spacing: 1.2-1.4px

---

## Glassmorphism Implementation

### Core Characteristics

1. **Backdrop Blur**: 16px-20px Gaussian blur
2. **Transparency**: 65-85% opacity white backgrounds
3. **Subtle Borders**: White borders at 60% opacity
4. **Soft Shadows**: Subtle shadows using rgba(31, 38, 135, 0.07)

### Component Patterns

#### Glass Card (matching Flutter `GlassCard`)

```css
.glass-card {
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.5rem; /* 24px */
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
}
```

**Web React:**
```tsx
<GlassCard padding="lg" blur="md" opacity="medium" rounded="xl">
  {children}
</GlassCard>
```

**Mobile Flutter:**
```dart
GlassCard(
  padding: EdgeInsets.all(20),
  borderRadius: BorderRadius.circular(24),
  child: child,
)
```

#### Glass Navigation Bar (matching Flutter `GlassFloatingNavBar`)

```css
.glass-nav {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 624.9375rem; /* pill shape */
  height: 3.5rem; /* 56px */
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.07);
}
```

**Web React:**
```tsx
<GlassNavBar
  items={[
    { icon: Home, label: 'Trips' },
    { icon: Sparkles, label: 'Explore' },
    { icon: MessageCircle, label: 'Concierge' },
  ]}
  activeIndex={activeTab}
  onItemClick={setActiveTab}
/>
```

**Mobile Flutter:**
```dart
GlassTravelerFloatingNavBar(
  activeIndex: _activeIndex,
  onTap: (index) => setState(() => _activeIndex = index),
)
```

#### Glass Pill Badge

```css
.glass-pill {
  background: rgba(0, 208, 132, 0.2);
  border: 1px solid rgba(0, 208, 132, 0.4);
  border-radius: 624.9375rem; /* pill */
  padding: 10px 14px;
}
```

---

## Border Radii (matching mobile exactly)

| Size | Value | Usage |
|------|-------|-------|
| Small | 8px | Small badges, tags |
| Medium | 12px | Input fields |
| Large | 14px | Buttons |
| XL | 24px | Cards, panels |
| 2XL | 32px | Large cards |
| Pill | 9999px | Navigation, pills, avatars |

---

## Shadows (Glass Style)

| Name | Value | Usage |
|------|-------|-------|
| Glass | `0 8px 32px rgba(31, 38, 135, 0.07)` | Glass cards |
| Card | `0 10px 20px rgba(0, 0, 0, 0.05)` | Standard cards |
| Button | `0 8px 14px rgba(0, 208, 132, 0.3)` | Primary button (green glow) |
| Nav | `0 10px 18px rgba(0, 0, 0, 0.07)` | Floating navigation |

---

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, #00D084 0%, #00B874 100%);
```
**Usage**: Buttons, CTAs, accent elements

### App Background Gradient (Light Mode)
```css
background: linear-gradient(135deg, #E0F7FA 0%, #F5F5F5 50%, #E3F2FD 100%);
```
**Usage**: Page backgrounds, full-screen gradients

### App Background Gradient (Dark Mode)
```css
background: linear-gradient(135deg, #0A2F2A 0%, #0D3530 50%, #0A2F2A 100%);
```
**Usage**: Dark mode page backgrounds

### Card Gradient
```css
background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
```
**Usage**: Hero cards, featured content

---

## Spacing Scale (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Small gaps |
| md | 16px | Standard gaps |
| lg | 24px | Large gaps |
| xl | 32px | Section spacing |
| 2xl | 48px | Page sections |
| 3xl | 64px | Large sections |

---

## Component Library

### Buttons

#### Primary Button (matching Flutter `ElevatedButton`)

**Visual:**
- Background: `#00D084` (Vivid Green)
- Text: White
- Border Radius: 14px
- Padding: 14px 24px
- Font: 16px Poppins Semibold
- Shadow: `0 2px 4px rgba(0, 208, 132, 0.3)`

**Web:**
```tsx
<button className="bg-primary text-white rounded-lg px-6 py-3.5 font-semibold shadow-button hover:bg-primary-hover transition-smooth">
  Create Proposal
</button>
```

**Mobile:**
```dart
ElevatedButton(
  onPressed: () {},
  child: Text('Create Proposal'),
)
```

#### Secondary Button (matching Flutter `OutlinedButton`)

**Visual:**
- Background: Transparent
- Border: 1.5px solid `#00D084`
- Text: `#00D084`
- Border Radius: 14px
- Padding: 14px 24px

### Input Fields (matching Flutter `InputDecoration`)

**Visual:**
- Background: `#FAFAFA`
- Border: 1px solid `#E5E7EB`
- Border Radius: 12px
- Padding: 14px 16px
- Focus Border: 2px solid `#00D084`

**Web:**
```tsx
<input className="bg-input border border-border rounded-xl px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20" />
```

### Navigation

#### Floating Bottom Navigation (mobile pattern on web)

**Key Features:**
- Pill-shaped (9999px border-radius)
- Glassmorphism with 85% opacity
- Active item has green (#00D084) circular background
- Inactive items are gray with 55% opacity
- 56-60px height
- Fixed to bottom with 12-16px margins

**Active State:**
- Background: `#00D084`
- Icon: White
- Shadow: `0 8px 14px rgba(0, 208, 132, 0.3)`
- Scale: 1.05 on hover

**Inactive State:**
- Background: Transparent
- Icon: `rgba(18, 78, 162, 0.55)` (Royal Blue 55%)
- Hover: `rgba(255, 255, 255, 0.4)`

### Glass Cards

#### Standard Glass Card

**Visual:**
- Background: `rgba(255, 255, 255, 0.65)`
- Backdrop Blur: 16px
- Border: 1px solid `rgba(255, 255, 255, 0.6)`
- Border Radius: 24px
- Shadow: `0 8px 32px rgba(31, 38, 135, 0.07)`
- Padding: 18-20px

#### Hero Glass Card ("Up Next" pattern)

**Visual:**
- Same glass effect as standard
- Border Radius: 32px (larger)
- Padding: 20px
- Contains:
  - Section label (11px UPPERCASE)
  - Large time display (40px Cormorant)
  - Activity title (22px Cormorant Italic)
  - Location with icon (13px)
  - Divider line
  - Action buttons

---

## Animation & Transitions

### Timing Functions

| Name | Value | Usage |
|------|------|-------|
| Fast | 150ms cubic-bezier(0.4, 0, 0.2, 1) | Micro-interactions |
| Base | 200ms cubic-bezier(0.4, 0, 0.2, 1) | Standard transitions |
| Slow | 300ms cubic-bezier(0.4, 0, 0.2, 1) | Page transitions |
| Slowest | 500ms cubic-bezier(0.4, 0, 0.2, 1) | Complex animations |

### Common Animations

#### Pulsing Dot (matching mobile `_PulsingDot`)

```css
@keyframes pulse-scale {
  0%, 100% {
    transform: scale(0.75);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.9;
  }
}

.pulse-dot {
  animation: pulse-scale 900ms ease-out infinite;
}
```

**Usage**: Live status indicators, "Current Day" badges

#### Button Hover

```css
.button-hover {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button-hover:hover {
  transform: scale(1.05);
}

.button-hover:active {
  transform: scale(0.95);
}
```

---

## Responsive Design

### Breakpoints (mobile-first)

| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Small desktops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

### Mobile-First Approach

Web app uses mobile design patterns adapted for larger screens:

- Navigation: Bottom nav on mobile → Side nav on desktop
- Cards: Full width on mobile → Grid on desktop
- Typography: Slightly smaller on mobile, larger on desktop
- Spacing: Tighter on mobile, more generous on desktop

---

## Implementation Checklist

### Web (Next.js/React)

- [x] Update `globals.css` with unified CSS variables
- [x] Create `DesignSystem` TypeScript constants
- [x] Implement `GlassCard` component
- [x] Implement `GlassNavBar` component
- [x] Implement `GlassPill` component
- [x] Implement `GlassIconButton` component
- [ ] Update existing components to use new design tokens
- [ ] Add Poppins and Cormorant Garamond fonts
- [ ] Update button components
- [ ] Update input components
- [ ] Update card components
- [ ] Test dark mode implementation
- [ ] Add storybook documentation

### Mobile (Flutter)

- [x] Existing `AppTheme` with all design tokens
- [x] `GlassCard` widget implemented
- [x] `GlassFloatingNavBar` widget implemented
- [x] `GlassPill` widget implemented
- [x] `GlassIconButton` widget implemented
- [x] Poppins and Cormorant Garamond fonts configured
- [x] Dark mode fully implemented

---

## Design Token Mapping

### Web → Mobile Equivalence

| Web | Mobile Flutter | Value |
|-----|----------------|-------|
| `--primary` | `AppTheme.primary` | `#00D084` |
| `--secondary` | `AppTheme.secondary` | `#124EA2` |
| `--glass-surface` | `AppTheme.glassSurface` | `rgba(255,255,255,0.65)` |
| `--glass-nav-surface` | `AppTheme.glassNavSurface` | `rgba(255,255,255,0.85)` |
| `.glass-card` | `GlassCard` | Backdrop blur + opacity |
| `.glass-nav` | `GlassFloatingNavBar` | Pill nav with blur |
| `rounded-xl` | `BorderRadius.circular(24)` | 24px radius |
| `rounded-full` | `BorderRadius.circular(999)` | Pill shape |

---

## Visual Examples

### Glass Card Example

**Mobile (Flutter):**
```dart
GlassCard(
  padding: EdgeInsets.all(20),
  borderRadius: BorderRadius.circular(32),
  child: Column(
    children: [
      Text('UP NEXT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
      SizedBox(height: 10),
      Text('14:00', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w700)),
      SizedBox(height: 8),
      Text('Burj Khalifa Tour', style: TextStyle(fontSize: 22, fontStyle: FontStyle.italic)),
    ],
  ),
)
```

**Web (React):**
```tsx
<GlassCard padding="xl" rounded="2xl">
  <div className="space-y-2.5">
    <p className="text-xs font-bold tracking-wider text-text-secondary">UP NEXT</p>
    <p className="text-5xl font-bold font-serif text-primary leading-none">14:00</p>
    <p className="text-2xl font-bold font-serif italic text-secondary">Burj Khalifa Tour</p>
  </div>
</GlassCard>
```

### Navigation Bar Example

**Mobile (Flutter):**
```dart
GlassTravelerFloatingNavBar(
  activeIndex: 0,
  onTap: (index) => setState(() => _activeIndex = index),
)
```

**Web (React):**
```tsx
<GlassNavBar
  items={travelerNavItems}
  activeIndex={activeTab}
  onItemClick={setActiveTab}
/>
```

---

## Brand Guidelines

### Do's

✅ Use Vivid Green (#00D084) for primary CTAs
✅ Use Royal Blue (#124EA2) for text and icons
✅ Apply glassmorphism to cards and navigation
✅ Use Cormorant Garamond for headings
✅ Use Poppins for UI elements
✅ Maintain consistent spacing (8px scale)
✅ Use pill shapes for navigation and badges
✅ Apply subtle shadows and blur

### Don'ts

❌ Don't use colors outside the defined palette
❌ Don't use border-radius values not in the scale
❌ Don't mix glassmorphism with solid backgrounds
❌ Don't use fonts other than Poppins or Cormorant
❌ Don't create custom spacing values
❌ Don't skip backdrop blur on glass elements
❌ Don't use heavy shadows

---

## Accessibility

### Color Contrast

- Primary (#00D084) on white: **WCAG AAA** (contrast ratio 3.5:1 for large text)
- Secondary (#124EA2) on white: **WCAG AAA** (contrast ratio 8.1:1)
- Text Primary (#124EA2) on Background (#F5F5F5): **WCAG AA**

### Focus States

All interactive elements must have visible focus indicators using the primary green:

```css
.focus-visible:focus {
  outline: 2px solid #00D084;
  outline-offset: 2px;
}
```

### Keyboard Navigation

- All navigation items are keyboard accessible
- Tab order follows logical flow
- Skip links provided for main content

---

## Testing

### Cross-Platform Visual Consistency

**Test Scenarios:**
1. Compare mobile Flutter app and web app side-by-side
2. Verify color accuracy (hex values match exactly)
3. Check typography sizing and weights match
4. Confirm glassmorphism effects appear similar
5. Test navigation interactions (active states, transitions)
6. Verify spacing matches across platforms

**Tools:**
- Color picker to verify hex values
- Screenshot comparison
- Device testing (iPhone, Android, Desktop browsers)

---

## Resources

### Design Files

- Figma Design System: [Link]
- Mobile App (Flutter): `apps/mobile/lib/core/theme/app_theme.dart`
- Web Design System: `apps/web/src/styles/design-system.ts`
- Web Global Styles: `apps/web/src/app/globals.css`

### Component Libraries

- Web Glass Components: `apps/web/src/components/glass/`
- Mobile Glass Widgets: `apps/mobile/lib/core/ui/glass/`

### Fonts

- Poppins: Google Fonts
- Cormorant Garamond: Google Fonts

---

## Changelog

**v1.0 (February 2026)**
- Initial design system alignment
- Implemented glassmorphism across web and mobile
- Unified color palette and typography
- Created glass component libraries
- Updated documentation

---

**This document ensures the Travel Suite web and mobile apps feel like part of the same family, providing a cohesive, premium user experience across all touchpoints.**
