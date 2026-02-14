# Travel Suite - Stitch Design Implementation Specification

**Last Updated:** February 14, 2026
**Design Source:** https://stitch.withgoogle.com/projects/15964200879465447191
**Status:** Implementation in Progress

## Overview

This document provides detailed specifications for implementing the Stitch UX designs in the Travel Suite Flutter mobile application. All designs follow a premium glassmorphism aesthetic with soft gradients and clean typography.

## Design Tokens

### Colors

| Token | Hex Value | Usage |
|-------|-----------|-------|
| **Primary (Mint)** | `#00D084` | Primary actions, active states, accents |
| **Secondary (Deep Blue)** | `#124EA2` | Headers, secondary text, icons |
| **Muted Gray** | `#6B7280` | Tertiary text, disabled states |
| **Glass Surface** | `rgba(255, 255, 255, 0.65)` | Card backgrounds |
| **Glass High** | `rgba(255, 255, 255, 0.90)` | Navigation, elevated surfaces |
| **Glass Nav** | `rgba(255, 255, 255, 0.85)` | Top navigation bar |

### Typography

| Element | Font Family | Weight | Size |
|---------|-------------|--------|------|
| **Display Headings** | Cormorant Garamond | Bold (700) | 32-44px |
| **Subheadings** | Cormorant Garamond | Semi-Bold (600) | 20-24px |
| **Body Text** | Poppins | Regular (400) | 14-16px |
| **Body Semi-Bold** | Poppins | Semi-Bold (600) | 14-16px |
| **Labels** | Poppins | Bold (700) | 11-12px |
| **Buttons** | Poppins | Bold (700) | 14-16px |

### Spacing & Layout

- **Card Border Radius:** 24px (primary cards), 16px (secondary)
- **Icon Sizes:** 18-20px (standard), 24px (large)
- **Button Height:** 52px (primary), 48px (secondary)
- **Padding (Cards):** 18-20px
- **Gap Between Elements:** 12-16px (standard), 6-8px (tight)

### Effects

#### Glassmorphism
```css
background: rgba(255, 255, 255, 0.65);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.6);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
```

#### Background Gradient
```css
background: linear-gradient(135deg, #E0F7FA 0%, #F5F5F5 50%, #E3F2FD 100%);
```

## Screen Specifications

### 1. Auth Portal (`auth_portal.html`)

**Design Elements:**
- Soft gradient background
- Centered glass card with role toggle
- Clean input fields with underline animation
- Primary action button with arrow icon

**Key Components:**

1. **Header**
   - Title: "Travel Suite" (Cormorant Garamond, italic, 32px, Deep Blue)
   - Subtitle: "Luxury Redefined" (Poppins, 14px, muted)

2. **Role Toggle**
   - Segmented control: "Traveler" | "Driver"
   - Pill background with sliding indicator
   - Active: white background, shadow
   - Inactive: transparent

3. **Input Fields**
   - Label: uppercase, 11px, bold, letter-spacing 1.2px
   - Input: glass background, underline border
   - Focus: mint underline animation
   - Icons: envelope (email), eye/eye-slash (password)

4. **Primary Button**
   - Text: "Begin Journey" with arrow-right icon
   - Background: Mint (#00D084)
   - Height: 52px
   - Border radius: 14px

5. **Footer Link**
   - "Don't have an account? Request Access"
   - Deep Blue color

### 2. Traveler Dashboard (`traveler_dashboard.html`)

**Design Elements:**
- Sticky glass navigation header
- Status pill with animated dot
- Driver card with profile photo
- Large time display (44px)
- Quick action tiles in 2x2 grid

**Key Components:**

1. **Header (Sticky)**
   - Kicker: "OCTOBER 14-16 • DELHI" (11px, uppercase, primary)
   - Title: "My Journeys" (Cormorant Garamond, 32px, bold)
   - Bell icon (notifications)
   - Glass background with blur

2. **Status Pill**
   - "Current: Day 1 - Arrival"
   - Pulsing green dot
   - Mint background (10% opacity)
   - Mint border (20% opacity)

3. **Driver Card**
   - Profile photo: 56px circle, white border
   - Green active indicator dot
   - Name: Cormorant Garamond, 20px, bold
   - Vehicle info: 12px, muted
   - Action buttons: phone (mint), message (blue)

4. **Up Next Card**
   - Label: "UP NEXT" (11px, uppercase)
   - Time: 44px, mint color
   - Activity title: Cormorant Garamond, italic, 24px
   - Location: with map pin icon
   - "Get Directions" link with arrow

5. **Quick Actions Grid**
   - 2x2 grid layout
   - Each tile: glass card, 24px border radius
   - Icon: 48px rounded container
   - Labels: "Itinerary", "Expenses", "Weather", "Concierge"

6. **Bottom Navigation**
   - 5 items: Home, Itinerary, Add, Messages, Profile
   - Active: mint color with indicator dot
   - Glass background

### 3. Driver Command (`driver_command.html`)

**Design Elements:**
- Driver ID badge in header
- ON DUTY toggle with status indicator
- Current job card with large time
- Start Navigation CTA button
- Upcoming routes list
- Vehicle status card

**Key Components:**

1. **Header**
   - "DRIVER ID: 8832" badge (mint background)
   - "ON DUTY" toggle (green/gray)
   - Profile: circle avatar, name, status

2. **Current Job Card**
   - Time: 44px, mint
   - Date: "Today, Oct 15"
   - Passenger name
   - Pickup location with map pin
   - "Start Navigation" button (Deep Blue, full width)

3. **Upcoming Routes**
   - Title: "Upcoming Routes" | "TODAY"
   - List items: time + activity + location
   - Navigation icon buttons

4. **Vehicle Status**
   - Toyota Innova icon
   - Range: "425 km" display
   - "75%" battery/fuel indicator

### 4. Itinerary Timeline (`itinerary_timeline.html`)

**Design Elements:**
- Horizontal date selector
- Timeline cards with time badges
- Image previews for activities
- Status indicators (Confirmed, Landed, etc.)

**Key Components:**

1. **Date Selector**
   - Horizontal scroll
   - Selected date: mint background
   - Format: "Oct 14", "Oct 15", etc.

2. **Timeline Cards**
   - Time badge: top-left, rounded
   - Activity title
   - Location
   - Image preview (when available)
   - Status pill: "Confirmed", "Landed"
   - Mint accent color

3. **Activity Types**
   - Transfer: car icon
   - Sightseeing: camera icon
   - Meal: utensils icon
   - Check-in: building icon

## Implementation Checklist

### Theme Updates
- [x] Extract color palette from Stitch designs
- [ ] Update `app_theme.dart` with Stitch colors
- [ ] Add Cormorant Garamond font to pubspec.yaml
- [ ] Create glassmorphism card widgets
- [ ] Add background gradient

### Auth Portal
- [ ] Update role toggle animation
- [ ] Implement input underline animation
- [ ] Add Begin Journey button with icon
- [ ] Update background gradient

### Traveler Dashboard
- [ ] Create sticky glass header
- [ ] Add status pill with pulsing dot
- [ ] Update driver card layout
- [ ] Implement Up Next card with large time
- [ ] Create quick actions grid (2x2)
- [ ] Add bottom navigation

### Driver Command
- [ ] Add driver ID badge
- [ ] Implement ON DUTY toggle
- [ ] Create current job card
- [ ] Add Start Navigation button
- [ ] Create upcoming routes list
- [ ] Add vehicle status card

### Itinerary Timeline
- [ ] Create horizontal date selector
- [ ] Implement timeline cards
- [ ] Add time badges
- [ ] Create image preview layout
- [ ] Add status pills

## Flutter Widget Mapping

### Existing → New Design

| Current Component | Stitch Design Equivalent | Changes Needed |
|-------------------|-------------------------|----------------|
| `auth_screen.dart` | Auth Portal | Update layout, add animations |
| `traveler_dashboard.dart` | Traveler Dashboard | Restructure layout, add sticky header |
| `driver_dashboard.dart` | Driver Command | Add duty toggle, update cards |
| `trip_detail_screen.dart` | Itinerary Timeline | Add date selector, timeline view |

## Assets Required

### Icons
- Material Symbols Outlined (already using HeroIcons - compatible)
- Custom icons for vehicle types (if needed)

### Images
- Placeholder avatar images
- Sample activity images for timeline

### Fonts
- Cormorant Garamond (600, 700, italic)
- Poppins (400, 500, 600, 700) - already included

## Testing Requirements

1. **Visual Testing**
   - Compare screenshots with Stitch designs
   - Verify colors match exactly
   - Check spacing and typography

2. **Interaction Testing**
   - Role toggle animation
   - Input focus animations
   - Button hover/press states
   - Navigation transitions

3. **Responsive Testing**
   - Test on different screen sizes
   - Verify glassmorphism effects on different backgrounds
   - Check text overflow handling

## Notes

- All measurements are in logical pixels (dp/pt)
- Glassmorphism requires backdrop-filter support
- Animations should use ease-out curves (0.3s duration)
- Maintain accessibility (contrast ratios, touch targets)
- Keep design system consistent across all screens

## References

- Stitch Project: https://stitch.withgoogle.com/projects/15964200879465447191
- Design Files: `docs/stitch/15964200879465447191/`
- Brand Identity: `docs/brand_identity.md`
