# Professional Itinerary UI (Phase 6)

## Overview

The Professional Itinerary View component provides a WBB Kenya Safari PDF-quality display for travel itineraries with:

- **Cover page** with hero design and operator branding
- **Timeline-connected day cards** with vertical line visual
- **Accordion-style expansion** for day-by-day details
- **Rich activity cards** with 8-10 sentence descriptions
- **Activity images** when available
- **Inclusions/Exclusions section** with color-coded cards
- **Dynamic operator branding** (logo, primary color)
- **Print-ready styling** for professional PDF export

## Component Usage

### Basic Implementation

```typescript
import ProfessionalItineraryView from '@/components/itinerary/ProfessionalItineraryView';
import { ItineraryResult } from '@/types/itinerary';

function ItineraryPage() {
  const itinerary: ItineraryResult = {
    trip_title: "Kenya Safari Adventure",
    destination: "Kenya",
    duration_days: 7,
    summary: "Experience the best of Kenya...",
    days: [
      {
        day_number: 1,
        theme: "Arrival & Nairobi City Tour",
        activities: [
          {
            title: "Giraffe Centre Visit",
            description: "Long 8-10 sentence description...",
            location: "Giraffe Centre, Nairobi",
            time: "09:00 AM",
            duration: "2-3 hours",
            cost: "$25 per person",
            transport: "Hotel pickup via private vehicle (30 min)"
          }
        ]
      }
    ]
  };

  return (
    <ProfessionalItineraryView
      itinerary={itinerary}
      images={{}} // Optional: activity images
      organizationBranding={{
        logo_url: "https://example.com/logo.png",
        primary_color: "#00d084",
        name: "Safari Adventures Ltd"
      }}
    />
  );
}
```

### With Activity Images

```typescript
// Fetch images for activities
const images = {
  "1-0": "https://images.unsplash.com/photo-giraffe-centre",
  "1-1": "https://images.unsplash.com/photo-nairobi-national-park",
  "2-0": "https://images.unsplash.com/photo-masai-mara"
};

<ProfessionalItineraryView
  itinerary={itinerary}
  images={images}
  organizationBranding={branding}
/>
```

### Integration with Existing Planner

Update `apps/web/src/app/planner/page.tsx`:

```typescript
// Add import
import ProfessionalItineraryView from '@/components/itinerary/ProfessionalItineraryView';

// In your result display section, replace existing itinerary display with:
{result && (
  <div className="mt-8">
    <ProfessionalItineraryView
      itinerary={result}
      images={images}
      organizationBranding={{
        logo_url: organizationData?.logo_url,
        primary_color: organizationData?.primary_color,
        name: organizationData?.name
      }}
    />
  </div>
)}
```

## Component Props

### `ProfessionalItineraryView`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `itinerary` | `ItineraryResult` | Yes | Complete itinerary data |
| `images` | `Record<string, string \| null>` | No | Activity images keyed by `{dayNumber}-{activityIndex}` |
| `organizationBranding` | `OrganizationBranding` | No | Operator branding (logo, color, name) |

### `OrganizationBranding`

```typescript
interface OrganizationBranding {
  logo_url?: string;        // URL to operator logo (white version recommended)
  primary_color?: string;   // Hex color code (default: #00d084)
  name?: string;            // Operator name for footer
}
```

### `ItineraryResult`

```typescript
interface ItineraryResult {
  trip_title: string;
  destination: string;
  duration_days: number;
  summary: string;
  budget?: string;
  interests?: string[];
  tips?: string[];          // Used for inclusions/exclusions
  days: Day[];
}

interface Day {
  day_number: number;
  theme: string;
  activities: Activity[];
}

interface Activity {
  title: string;
  description: string;      // 8-10 sentences minimum for quality
  location?: string;
  time?: string;            // "09:00 AM" or "Morning"
  duration?: string;        // "2-3 hours allowing time..."
  cost?: string;            // "$25" or "Free" or "Included"
  transport?: string;       // Getting there instructions
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

## Features

### 1. Cover Page

Professional hero section with:
- Decorative background pattern
- Operator logo (white/inverted)
- Destination badge with icon
- Large trip title (4xl-6xl font)
- Summary paragraph
- Trip metadata (duration, budget, interests)

**Customization:**
- Brand color applied to timeline dots and accents
- Logo automatically inverted for dark background
- Responsive typography (4xl → 5xl → 6xl)

### 2. Timeline Day Cards

Accordion-style cards with:
- Vertical timeline line connecting all days
- Colored dots matching brand color
- Day number badge
- Expand/collapse functionality
- Activity count indicator

**Behavior:**
- First day expanded by default
- Click header to toggle
- Auto-expand all in print mode
- Smooth transitions (screen only)

### 3. Activity Cards

Rich activity display:
- Hero image (if available) with title overlay
- Metadata row (time, duration, cost icons)
- Full 8-10 sentence description
- Transport info box (if provided)

**Image Handling:**
- 16:9 aspect ratio (h-64)
- Gradient overlay for text readability
- Hover scale effect (screen only)
- Fallback to text-only layout

### 4. Inclusions/Exclusions

Two-column grid with:
- **Left**: What's Included (green theme)
- **Right**: What's Not Included (red theme)
- Icon indicators (checkmark vs X)
- Derived from `itinerary.tips` array

**Logic:**
```typescript
// First half = inclusions, second half = exclusions
const inclusions = tips.slice(0, Math.ceil(tips.length / 2));
const exclusions = tips.slice(Math.ceil(tips.length / 2));
```

### 5. Print Styling

Professional print output:
- A4 page size with proper margins
- Page breaks avoid splitting cards
- All days auto-expanded
- Colors preserved (badges, timeline)
- Shadows removed
- Links show URLs
- Cover page gets full page

**Print command:**
```javascript
window.print(); // Or use browser's print dialog
```

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Smaller typography (text-4xl → text-5xl)
- Stacked metadata
- Full-width cards
- Touch-friendly accordion

### Tablet (768px - 1024px)
- Medium typography (text-5xl)
- Two-column inclusions/exclusions
- Comfortable padding

### Desktop (> 1024px)
- Maximum width 5xl (80rem)
- Large typography (text-6xl)
- Centered layout
- Spacious padding (p-16)

## Branding Customization

### Primary Color

Applied to:
- Timeline dots
- Day number badges (border/text)
- Metadata icons (time, duration, cost)

```typescript
const brandColor = organizationBranding?.primary_color || '#00d084';

// Usage in component:
<div style={{ backgroundColor: brandColor }} />
<Badge style={{ borderColor: brandColor, color: brandColor }} />
<Clock style={{ color: brandColor }} />
```

### Operator Logo

Best practices:
- White/light version recommended (dark background)
- SVG or PNG with transparency
- Minimum 200px height for quality
- Will be inverted (filter: brightness(0) invert)

Placement:
- Top left of cover page
- Height: h-12 (mobile) → h-16 (desktop)

### Operator Name

Displayed in footer:
```
Generated with {organizationBranding?.name || 'Travel Suite'}
This itinerary is subject to availability...
```

## Styling & Theming

### Color Palette

**Light Mode:**
- Background: White
- Text: Slate-900
- Borders: Slate-200
- Cards: White with shadow

**Dark Mode:**
- Background: Slate-950
- Text: White
- Borders: Slate-700/White-10
- Cards: Slate-900 with subtle shadow

**Brand Colors:**
- Primary: Customizable (default #00d084)
- Inclusions: Emerald (green theme)
- Exclusions: Rose (red theme)

### Typography

**Font Families:**
- Headings: `font-serif` (Cormorant Garamond)
- Body: `font-sans` (Poppins)

**Font Sizes:**
- Cover title: 4xl (mobile) → 6xl (desktop)
- Section headings: 3xl
- Day themes: xl
- Activity titles: lg
- Body text: base
- Metadata: sm

## Performance

### Lazy Loading

Images are lazy-loaded by default:
```tsx
<img
  src={image}
  alt={activity.title}
  loading="lazy" // Browser native lazy load
/>
```

### Accordion State

Only expanded days render full content:
```tsx
{isExpanded && (
  <div>
    {/* Activity cards only rendered when expanded */}
  </div>
)}
```

### Print Mode Detection

Auto-expand for printing:
```tsx
{(isExpanded || window.matchMedia('print').matches) && (
  // Content
)}
```

## Accessibility

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3 → h4)
- Button elements for interactive accordion
- Alt text for images
- ARIA labels where needed

### Keyboard Navigation
- Accordion toggles are focusable buttons
- Standard tab navigation
- Enter/Space to toggle

### Screen Readers
- Descriptive labels
- Icon alternatives
- Proper content structure

## Migration from Old UI

### Step 1: Install Component

Component already created at:
```
apps/web/src/components/itinerary/ProfessionalItineraryView.tsx
```

Print styles at:
```
apps/web/src/styles/print.css
```

### Step 2: Import in Layout

Already added to `apps/web/src/app/layout.tsx`:
```typescript
import "@/styles/print.css";
```

### Step 3: Replace Old Display

In your page/component:

**Before:**
```tsx
{result && (
  <div className="space-y-8">
    {/* Old itinerary display code */}
  </div>
)}
```

**After:**
```tsx
{result && (
  <ProfessionalItineraryView
    itinerary={result}
    images={images}
    organizationBranding={organizationBranding}
  />
)}
```

### Step 4: Fetch Organization Branding

```typescript
// Get current user's organization
const { data: { user } } = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single();

const { data: organization } = await supabase
  .from('organizations')
  .select('logo_url, primary_color, name')
  .eq('id', profile.organization_id)
  .single();

// Pass to component
<ProfessionalItineraryView
  itinerary={result}
  organizationBranding={organization}
/>
```

## Examples

### Example 1: Minimal Usage

```tsx
<ProfessionalItineraryView itinerary={itineraryData} />
```

Default behavior:
- No images shown
- Default brand color (#00d084)
- No operator logo
- Generic footer

### Example 2: With Images

```tsx
const images = {};
itinerary.days.forEach(day => {
  day.activities.forEach((act, idx) => {
    const key = `${day.day_number}-${idx}`;
    images[key] = fetchActivityImage(act.title, act.location);
  });
});

<ProfessionalItineraryView itinerary={itinerary} images={images} />
```

### Example 3: Full Branding

```tsx
<ProfessionalItineraryView
  itinerary={itinerary}
  images={images}
  organizationBranding={{
    logo_url: "https://cdn.example.com/safari-adventures-white.svg",
    primary_color: "#d97706", // Amber
    name: "Safari Adventures Ltd"
  }}
/>
```

Result:
- Amber-colored timeline dots and badges
- Safari Adventures logo on cover
- Footer: "Generated with Safari Adventures Ltd"

## Troubleshooting

### Images Not Showing

**Problem**: Activity images not displaying

**Solution**:
```typescript
// Ensure image key matches format: "{dayNumber}-{activityIndex}"
const key = `${day.day_number}-${activityIndex}`;
images[key] = imageUrl;

// Example for Day 1, Activity 0:
images["1-0"] = "https://example.com/image.jpg";
```

### Timeline Dots Wrong Color

**Problem**: Timeline dots not showing brand color

**Solution**:
```typescript
// Pass primary_color in hex format
organizationBranding={{
  primary_color: "#d97706" // ✅ With #
  // NOT: "d97706" // ❌ Without #
}}
```

### Print Output Poor Quality

**Problem**: Print looks broken

**Solutions**:
1. Ensure print.css is imported in layout
2. Use Chrome/Edge for best print results
3. Set print settings to "Background graphics: On"
4. Check page size: A4 or Letter

### Dark Mode Issues

**Problem**: Dark mode text invisible in print

**Solution**: Print CSS automatically overrides dark mode:
```css
@media print {
  .dark\:text-white {
    color: #000 !important;
  }
}
```

## Future Enhancements

### Phase 6.1: Enhanced Features
- [ ] Accommodation cards between days
- [ ] Map integration showing route
- [ ] Weather forecast per day
- [ ] Packing list section
- [ ] Emergency contacts section

### Phase 6.2: Customization
- [ ] Template selector (safari_story, urban_brief, etc.)
- [ ] Custom color schemes beyond primary
- [ ] Multiple logo positions
- [ ] Cover photo customization
- [ ] Footer customization

### Phase 6.3: Interactive Features
- [ ] Share button with social media
- [ ] Add to calendar (per day or full trip)
- [ ] Export to Google Maps
- [ ] Customer feedback/rating
- [ ] Booking integration

---

**Last Updated**: 2026-02-19
**Version**: 1.0.0 (Phase 6)
**Status**: ✅ Component Complete - Integration Ready
