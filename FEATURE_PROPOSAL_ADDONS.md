# 📦 Proposal Add-Ons Feature

## Overview

This feature allows tour operators to add optional add-ons and upgrades to their proposals, and enables clients to select which ones they want to include in their trip.

---

## 🎯 Features

### For Tour Operators (Admin)

1. **Add Add-Ons to Proposals**
   - Search and filter available add-ons
   - Add multiple add-ons to any proposal
   - Mark add-ons as "included by default" or "optional"
   - Remove add-ons from proposals

2. **Manage Add-On Status**
   - Toggle between "included by default" and "optional"
   - See which add-ons clients have selected
   - Track total add-ons value

3. **Real-Time Pricing**
   - Proposal price automatically updates when add-ons change
   - See breakdown of base price + add-ons

### For Clients (Proposal View)

1. **View All Add-Ons**
   - See add-ons included by default
   - Browse optional upgrades

2. **Select Optional Add-Ons**
   - Click to toggle add-on selection
   - See price update in real-time
   - Visual feedback for selections

3. **Understand What's Included**
   - Clear distinction between included and optional
   - See category, duration, and price for each add-on
   - Read detailed descriptions

---

## 🗂️ Database Schema

### Table: `proposal_addons`

```sql
CREATE TABLE proposal_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    is_selected_by_client BOOLEAN NOT NULL DEFAULT false,
    is_included_by_default BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, addon_id)
);
```

### Key Fields

- **`proposal_id`**: Links to the proposal
- **`addon_id`**: Links to the add-on from the addons table
- **`is_selected_by_client`**: Whether the client has selected this add-on
- **`is_included_by_default`**: Whether this add-on is included in the base price
- **`notes`**: Optional notes or customizations for this specific proposal

### Automatic Price Calculation

The database includes a trigger that automatically recalculates the proposal's `client_selected_price` whenever add-ons change:

```sql
client_selected_price = base_price +
  SUM(addon.price WHERE is_selected_by_client OR is_included_by_default)
```

---

## 📁 Files Created

### Components

1. **`/src/components/admin/ProposalAddOnsManager.tsx`**
   - Admin component for managing add-ons on a proposal
   - Features:
     - Add add-ons with search and filter
     - Toggle default inclusion
     - Remove add-ons
     - See client selections
     - Track total value

2. **`/src/components/client/ProposalAddOnsSelector.tsx`**
   - Client-facing component for selecting add-ons
   - Features:
     - View included add-ons
     - Select/deselect optional add-ons
     - See price updates in real-time
     - Visual feedback for selections

### Database Migration

**`DATABASE_MIGRATION_PROPOSAL_ADDONS.sql`**
- Creates `proposal_addons` table
- Adds indexes for performance
- Sets up RLS (Row Level Security) policies
- Creates triggers for automatic price calculation
- Includes comprehensive comments

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Run the migration in your Supabase SQL editor:

```bash
# In Supabase Dashboard → SQL Editor
# Copy and paste contents of DATABASE_MIGRATION_PROPOSAL_ADDONS.sql
# Click "Run"
```

Or via CLI:
```bash
supabase db push DATABASE_MIGRATION_PROPOSAL_ADDONS.sql
```

### Step 2: Verify Table Creation

```sql
-- Check if table exists
SELECT * FROM proposal_addons LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'proposal_addons';
```

### Step 3: Update Type Definitions

Generate new TypeScript types:

```bash
cd projects/travel-suite/apps/web
npx supabase gen types typescript --project-id rtdjmykkgmirxdyfckqi > src/lib/database.types.ts
```

### Step 4: Test the Feature

1. **Admin Side**:
   - Go to `/admin/proposals/[id]`
   - Scroll to "Add-Ons & Upgrades" section
   - Click "Add Add-On"
   - Search and add some add-ons
   - Toggle "Include by Default"

2. **Client Side**:
   - Open proposal in client view `/p/[share_token]`
   - Scroll to "Customize Your Experience" section
   - Click on optional add-ons to select/deselect
   - See price update in real-time

---

## 💻 Usage Examples

### Admin: Adding Add-Ons to a Proposal

```tsx
import ProposalAddOnsManager from '@/components/admin/ProposalAddOnsManager';

// In your proposal view page
<ProposalAddOnsManager
  proposalId={proposalId}
  readonly={false}
/>
```

### Client: Selecting Add-Ons

```tsx
import ProposalAddOnsSelector from '@/components/client/ProposalAddOnsSelector';

// In your client proposal view
<ProposalAddOnsSelector
  proposalId={proposalId}
  onPriceChange={(newPrice) => {
    console.log('New total with add-ons:', newPrice);
  }}
/>
```

### API: Fetching Proposal Add-Ons

```typescript
const supabase = createClient();

// Get all add-ons for a proposal
const { data } = await supabase
  .from('proposal_addons')
  .select(`
    *,
    addons (
      id,
      name,
      description,
      price,
      category,
      image_url
    )
  `)
  .eq('proposal_id', proposalId);
```

### API: Updating Client Selection

```typescript
// Client selects an add-on
await supabase
  .from('proposal_addons')
  .update({ is_selected_by_client: true })
  .eq('id', proposalAddonId);

// Proposal price updates automatically via trigger!
```

---

## 🎨 UI/UX Features

### Admin Interface

**Search and Filter**:
- Search by name, description, category
- Filter by category (Activities, Dining, Transport, Upgrades)
- Only shows add-ons not already added

**Visual Indicators**:
- Blue ring: Included by default
- Green ring: Selected by client
- Gray: Optional (not selected)

**Quick Actions**:
- One-click to include/exclude by default
- Remove button to take off proposal
- Price shown prominently

### Client Interface

**Clickable Cards**:
- Click anywhere on card to toggle selection
- Checkbox shows selection status
- Loading spinner while saving

**Price Display**:
- Individual add-on prices shown
- Total optional add-ons price at top
- Real-time updates

**Categories**:
- Color-coded badges (Activities, Dining, etc.)
- Duration shown if available
- Clear descriptions

---

## 🔐 Security (RLS Policies)

### Authenticated Users (Tour Operators)

- **SELECT**: Can view all proposal add-ons
- **INSERT**: Can add add-ons to their organization's proposals
- **UPDATE**: Can modify add-ons on their organization's proposals
- **DELETE**: Can remove add-ons from their organization's proposals

### Anonymous Users (Clients)

- **SELECT**: No access (must use join through proposals)
- **UPDATE**: Can update `is_selected_by_client` via share token
  - Only for the specific proposal they have access to
  - Cannot modify other fields

### Policy Examples

```sql
-- Tour operators can add add-ons to their proposals
CREATE POLICY "Allow users to insert proposal addons"
ON proposal_addons FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM proposals
    WHERE proposals.id = proposal_addons.proposal_id
    AND proposals.organization_id = auth.uid()::uuid
  )
);

-- Clients can select add-ons via share token
CREATE POLICY "Allow clients to select addons via share token"
ON proposal_addons FOR UPDATE
TO anon
USING (
  EXISTS (
    SELECT 1 FROM proposals
    WHERE proposals.id = proposal_addons.proposal_id
    AND current_setting('request.jwt.claims', true)::jsonb->>'share_token' = proposals.share_token
  )
);
```

---

## 📊 Data Flow

### Adding an Add-On (Admin)

1. Admin clicks "Add Add-On"
2. Modal shows available add-ons (filtered, searchable)
3. Admin clicks add button
4. **INSERT** into `proposal_addons` table
5. Component reloads to show new add-on
6. Price trigger calculates new `client_selected_price`

### Selecting an Add-On (Client)

1. Client clicks on optional add-on card
2. **UPDATE** `is_selected_by_client = true`
3. Database trigger recalculates proposal price
4. Component reloads with updated data
5. Parent component notified of price change
6. UI shows updated total

### Price Calculation Flow

```
User Action → Database Update → Trigger Fires → Price Recalculated → UI Updates
```

The trigger function:
1. Sums prices of all add-ons where `is_selected_by_client OR is_included_by_default`
2. Adds to proposal's `total_price`
3. Updates proposal's `client_selected_price`

---

## 🧪 Testing Checklist

### Admin Tests

- [ ] Can add add-ons to proposal
- [ ] Search filters work correctly
- [ ] Category filter works
- [ ] Can toggle "included by default"
- [ ] Can remove add-ons
- [ ] See client selections
- [ ] Price updates correctly

### Client Tests

- [ ] Can see included add-ons
- [ ] Can see optional add-ons
- [ ] Can select optional add-ons
- [ ] Can deselect add-ons
- [ ] Checkbox shows correct state
- [ ] Price updates in real-time
- [ ] Changes persist after page reload

### Edge Cases

- [ ] No add-ons available
- [ ] All add-ons already added
- [ ] Deleting an add-on that's selected
- [ ] Multiple clients selecting simultaneously
- [ ] Network errors during selection

---

## 🐛 Troubleshooting

### Issue: Add-ons not showing

**Check**:
1. Are add-ons marked as `is_active = true` in `addons` table?
2. Does the proposal have any add-ons linked?
3. Check browser console for errors

### Issue: Price not updating

**Check**:
1. Verify trigger is installed: `SELECT * FROM pg_trigger WHERE tgname LIKE '%proposal%addon%';`
2. Check if `client_selected_price` column exists on proposals table
3. Look for errors in Supabase logs

### Issue: Client can't select add-ons

**Check**:
1. Is RLS enabled on `proposal_addons`?
2. Is the share token valid?
3. Check browser console for 403 errors
4. Verify anon policy exists and is correct

### Issue: "Already added" when adding add-on

**Cause**: Unique constraint on `(proposal_id, addon_id)`
**Solution**: This is expected behavior. Each add-on can only be added once per proposal.

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Quantity Selection**
   - Allow clients to select quantity for each add-on
   - Useful for "Extra Night" or "Additional Guests"

2. **Add-On Dependencies**
   - Some add-ons require others (e.g., "Scuba Diving" requires "Insurance")
   - Implement dependency checking

3. **Conditional Pricing**
   - Early bird discounts
   - Bundle pricing (select 3+, get discount)
   - Seasonal pricing

4. **Add-On Categories Filtering (Client Side)**
   - Let clients filter by category
   - Group by type for better organization

5. **Recommendations**
   - AI-powered suggestions based on destination, dates, interests
   - "Popular choices" badge
   - "Clients who selected X also selected Y"

6. **Image Gallery**
   - Multiple images per add-on
   - Carousel view
   - Lightbox for full-screen viewing

7. **Reviews/Ratings**
   - Client ratings for add-ons
   - Written reviews
   - Star ratings display

---

## 📚 Related Documentation

- [Add-Ons Management](./UPSELL_ENGINE.md) - Managing the add-ons catalog
- [Proposal System](./PROPOSALS.md) - Overview of proposals feature
- [Database Schema](./DATABASE.md) - Complete database documentation
- [RLS Policies](./SECURITY.md) - Row-level security guide

---

## 📝 Changelog

### Version 1.0 (February 18, 2026)

**Initial Release**:
- ✅ Database schema and migration
- ✅ Admin component for managing add-ons
- ✅ Client component for selecting add-ons
- ✅ Automatic price calculation
- ✅ RLS policies for security
- ✅ Real-time updates
- ✅ Search and filter functionality
- ✅ Visual feedback and loading states

---

**Created**: February 18, 2026
**Author**: Avinash + Claude Sonnet 4.5
**Status**: Ready for Production
