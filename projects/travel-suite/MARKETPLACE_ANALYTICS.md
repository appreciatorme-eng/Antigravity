# Marketplace Analytics Implementation Plan

## Objective
Provide Tour Operators with insights into their profile performance
- [x] Create `marketplace_profile_views` table
- [x] Create API endpoint to track views (`POST /api/marketplace/[id]/view`)
- [x] Update `marketplace_profiles` list to show view counts (future work)
- [x] Create Analytics Dashboard page (`/admin/marketplace/analytics`)
- [x] Create Stats API endpoint (`/api/marketplace/stats`)
- [x] Add navigation to Analytics from Settings
 displaying:
    - Total Profile Views (All time / Last 30 days)
    - Total Inquiries Received
    - Conversion Rate (Views to Inquiries)
    - "Recent Views" list (showing which organizations viewed you, if public)

## Technical Implementation

### 1. Database Schema
New table: `marketplace_profile_views`
- `id` (UUID, PK)
- `profile_id` (UUID, FK -> marketplace_profiles.id)
- `viewer_org_id` (UUID, FK -> organizations.id, nullable)
- `viewed_at` (TIMESTAMPTZ, default now())
- `source` (TEXT, default 'direct')

### 2. API Endpoints
- **POST** `/api/marketplace/[id]/view`: Record a view.
  - Rate limiting: Prevent duplicate views from same user within 1 hour (using session/cookie).
- **GET** `/api/marketplace/stats`: Fetch analytics for the current user's organization.
  - Returns: `{ views: number, inquiries: number, recent_views: Organization[] }`

### 3. Frontend
- **Tracking**: Add `useEffect` in `apps/web/src/app/admin/marketplace/[id]/page.tsx` to call the view endpoint on mount.
- **Dashboard Page**: Create `apps/web/src/app/admin/marketplace/analytics/page.tsx`.
  - Use `GlassCard` components for metrics.
  - Display "Who viewed your profile" list (verified partners only feature?).

## Deployment
- Run migration SQL.
- Deploy new routes and pages.
