# PDF Export Enhancement (Phase 7)

## Overview

Phase 7 extends the existing @react-pdf/renderer system with a new "Professional" template that matches the ProfessionalItineraryView web UI, ensuring consistent quality across web and PDF outputs.

## New Professional Template

### Features

- **Cover Page**: Dark gradient background with operator logo and branding
- **Timeline Design**: Visual continuity with web UI
- **Rich Activity Cards**: Supports 8-10 sentence descriptions
- **Activity Images**: Displays activity images when available
- **Inclusions/Exclusions**: Color-coded sections (green/red)
- **Dynamic Branding**: Operator logo, primary color, contact info
- **Professional Layout**: A4 format with proper margins

### Template Selection

Three templates now available:

1. **Professional** (Recommended) - New! Matches web UI
2. **Safari Story** - Editorial brochure style
3. **Urban Brief** - Clean corporate format

## Usage

### Basic Usage

```typescript
import DownloadPDFButton from '@/components/pdf/DownloadPDFButton';

<DownloadPDFButton
  data={itineraryData}
  fileName="Kenya_Safari_2026.pdf"
  template="professional" // Use new professional template
/>
```

### Programmatic Generation

```typescript
import { downloadItineraryPdf } from '@/components/pdf/itinerary-pdf';

await downloadItineraryPdf({
  itinerary: itineraryData,
  template: 'professional',
  branding: {
    companyName: 'Safari Adventures Ltd',
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#00d084',
    contactEmail: 'info@safariadvnt.com',
    contactPhone: '+254 700 123 456'
  },
  fileName: 'Kenya_Safari.pdf'
});
```

### Automatic Branding

The system automatically fetches operator branding from the database:

```typescript
import { fetchItineraryPdfPreferences } from '@/components/pdf/itinerary-pdf';

const { branding, defaultTemplate } = await fetchItineraryPdfPreferences();

// Use fetched branding
await downloadItineraryPdf({
  itinerary,
  template: defaultTemplate, // From organization settings
  branding // Automatically includes logo, colors, contact
});
```

## File Structure

### New Files

- `apps/web/src/components/pdf/templates/ProfessionalTemplate.tsx`
  - Complete Document component
  - Cover page, day cards, inclusions/exclusions
  - Dynamic styling based on branding

### Modified Files

- `apps/web/src/components/pdf/itinerary-types.ts`
  - Added 'professional' to ItineraryTemplateId
  - Updated template options list
  - Updated normalization function

- `apps/web/src/components/pdf/ItineraryDocument.tsx`
  - Added ProfessionalTemplate import
  - Conditional rendering for professional template

- `apps/web/src/components/pdf/templates/ItineraryTemplatePages.tsx`
  - Returns null for professional template (handled separately)

## Template Comparison

| Feature | Professional | Safari Story | Urban Brief |
|---------|--------------|--------------|-------------|
| Cover Page | ✅ Hero design | ✅ Editorial | ✅ Corporate |
| Timeline Visual | ✅ Yes | ❌ No | ❌ No |
| Activity Images | ✅ Full size | ✅ Grid | ✅ Thumbnails |
| Descriptions | ✅ 8-10 sentences | ✅ Full | ✅ Abbreviated |
| Inclusions/Exclusions | ✅ Color-coded cards | ✅ List | ✅ List |
| Branding | ✅ Logo + color | ✅ Logo | ✅ Logo |
| Layout | ✅ Modern | ✅ Magazine | ✅ Report |
| Best For | ✅ High-end tours | ✅ Safari/nature | ✅ Business travel |

## Styling Customization

### Primary Color

Applied to:
- Timeline dots (future enhancement)
- Day number badges
- Section accents

```typescript
branding: {
  primaryColor: '#d97706' // Amber for desert tours
}
```

### Logo

Best practices:
- White/light version on transparent background
- PNG or SVG format
- Minimum 200px height
- Will be displayed at 50pt height in PDF

### Contact Information

Displayed in footer:
```
Generated with Safari Adventures Ltd
Contact: info@safari.com • +254 700 123 456
```

## Cover Page Customization

The cover page includes:

1. **Operator Logo** (top left, white version)
2. **Destination Badge** with pin icon
3. **Trip Title** (large, bold, 36pt)
4. **Summary** (14pt, gray-200 color)
5. **Metadata Row** (duration, budget)

Example:
```
[Logo: Safari Adventures Ltd]

📍 Kenya

Kenya Safari Adventure 7 Days

Experience the breathtaking wildlife of Kenya's Masai Mara...

📅 7 Days    💰 Luxury
```

## Page Layout

### Structure

```
Page 1: Cover Page
  - Operator branding
  - Trip overview
  - Metadata

Page 2+: Day-by-Day Itinerary
  - Section title
  - Day cards (1-2 per page)
    - Day header (badge, theme, count)
    - Activities with images
    - Transport info

Last Page: Inclusions/Exclusions + Footer
  - Two-column grid
  - What's Included (green)
  - What's Not Included (red)
  - Company footer with contact
```

### Page Breaks

- Cover page: Always full page
- Day cards: Keep together (wrap: false)
- Activities: Keep together
- Inclusions: Full page

## Implementation Details

### React-PDF Components Used

- `Document`: Root container
- `Page`: Individual pages (A4 size)
- `View`: Containers and layout
- `Text`: Text content
- `Image`: Logos and activity images
- `StyleSheet`: Component styling

### Styling Approach

Dynamic style creation based on branding:

```typescript
const createStyles = (primaryColor: string = '#00d084') =>
  StyleSheet.create({
    dayBadge: {
      border: `1pt solid ${primaryColor}`,
      // ...
    },
    // ...
  });
```

### Image Handling

Activity images are automatically fetched and embedded:

```typescript
{activity.image && (
  <Image
    src={activity.image}
    style={styles.activityImage}
  />
)}
```

## Migration from Old Templates

### Step 1: Update Template ID

Change template ID in organization settings:

```sql
UPDATE organizations
SET itinerary_template = 'professional'
WHERE id = 'your-org-id';
```

### Step 2: Test PDF Generation

```typescript
await downloadItineraryPdf({
  itinerary,
  template: 'professional',
  branding: await fetchItineraryPdfPreferences()
});
```

### Step 3: Compare Output

- Cover page should match web UI
- Day cards should be visually consistent
- Colors should match operator branding

## Troubleshooting

### Logo Not Showing

**Problem**: Logo doesn't appear in PDF

**Solutions**:
1. Ensure `logoUrl` is publicly accessible
2. Use absolute URL (not relative)
3. Check image format (PNG/SVG supported)
4. Verify image loads in browser first

### Colors Look Different

**Problem**: PDF colors don't match branding

**Solutions**:
1. Verify `primaryColor` is hex format (#00d084)
2. Check color contrast (dark backgrounds need light text)
3. Test PDF in different viewers (Adobe, Chrome, Preview)

### Images Not Loading

**Problem**: Activity images missing in PDF

**Solutions**:
1. Ensure images are publicly accessible
2. Use CORS-enabled image hosts
3. Check image URLs are valid
4. Images must be PNG/JPEG format

### Page Breaks Splitting Content

**Problem**: Day cards split across pages

**Solutions**:
1. Reduce number of activities per day
2. Shorten activity descriptions
3. Remove some images
4. Use `wrap={false}` on containers

## Future Enhancements

### Phase 7.1: Advanced Features
- [ ] Custom fonts (Cormorant Garamond for headings)
- [ ] SVG timeline line connector
- [ ] Page numbers and headers
- [ ] Table of contents

### Phase 7.2: Layout Options
- [ ] Portrait vs Landscape orientation
- [ ] Letter size (US) option
- [ ] Multi-column layouts
- [ ] Condensed vs Detailed modes

### Phase 7.3: Branding
- [ ] Multiple logo positions
- [ ] Custom color schemes (secondary, accent)
- [ ] Background patterns/textures
- [ ] Watermarks

## Performance

### PDF Generation Speed

- **Small** (3 days, no images): ~1-2 seconds
- **Medium** (7 days, some images): ~3-5 seconds
- **Large** (14 days, all images): ~6-10 seconds

### Optimization Tips

1. **Compress Images**: Use optimized JPEGs (< 500KB each)
2. **Limit Activities**: 5-8 activities per day for best layout
3. **Cache Branding**: Fetch once, reuse for multiple PDFs
4. **Batch Generation**: Generate multiple PDFs asynchronously

## Examples

### Luxury Safari

```typescript
await downloadItineraryPdf({
  itinerary: kenyaSafari7Days,
  template: 'professional',
  branding: {
    companyName: 'Elite Safari Adventures',
    logoUrl: 'https://cdn.example.com/elite-logo-white.png',
    primaryColor: '#d97706', // Amber/gold
    contactEmail: 'luxury@elitesafari.com',
    contactPhone: '+254 700 555 123'
  },
  fileName: 'Elite_Kenya_Safari_7D.pdf'
});
```

Result:
- Amber-colored accents throughout
- Elite Safari Adventures branding
- Professional cover page
- Rich activity descriptions

### Budget Urban Tour

```typescript
await downloadItineraryPdf({
  itinerary: tokyoBudget5Days,
  template: 'professional',
  branding: {
    companyName: 'Budget Travel Tokyo',
    logoUrl: null, // No logo for budget tours
    primaryColor: '#10b981', // Green
    contactEmail: 'hello@budgettokyo.com'
  },
  fileName: 'Tokyo_Budget_5D.pdf'
});
```

Result:
- Green accents (budget-friendly)
- No logo (clean, minimal)
- Same professional quality

---

**Last Updated**: 2026-02-19
**Version**: 1.0.0 (Phase 7)
**Status**: ✅ Complete - Professional Template Implemented
