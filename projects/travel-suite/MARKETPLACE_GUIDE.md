# Tour Operator Marketplace Guide

The Tour Operator Marketplace is a B2B feature within the Travel Suite that enables tour operators (organizations) to discover, rate, and collaborate with one another.

- **Inquiry Connection**: Direct interest messaging between organizations via the `marketplace_inquiries` table.
- **Global Search**: Full-text search (FTS) across bios and specialties for enhanced discovery.
- **Verification Workflow**: A structured path for operators to request "Verified Partner" status.

## Database Schema

### 1. `marketplace_profiles`
Extends the existing `organizations` table.
- ... existing fields ...
- `verification_status`: Tracks trust level (`none`, `pending`, `verified`, `rejected`).
- `search_vector`: A generated `tsvector` for optimized full-text search.

### 2. `marketplace_reviews`
...

### 3. `marketplace_inquiries`
Tracks partnership requests.
- `sender_org_id`: The initiating organization.
- `receiver_org_id`: The target organization.
- `message`: Context for the partnership request.
- `status`: Tracking the request (`pending`, `accepted`, `declined`).

## API Endpoints

### Marketplace Discovery
- `GET /api/marketplace`: Now supports Full-Text Search via the `q` parameter.

### Partner Inquiries
- `POST /api/marketplace/[id]/inquiry`: Sends a new partnership inquiry.

### Profile Management
- `PATCH /api/marketplace`: Supports `request_verification: true` to flag a profile for review.

## API Endpoints

### Marketplace Discovery
- `GET /api/marketplace`: Returns a list of all marketplace-enabled organizations.
  - Query Params: `q` (name search), `region` (region filter), `specialty` (specialty filter).

### Profile Management
- `PATCH /api/marketplace`: Allows an organization admin to create or update their own marketplace listing.

### Peer Reviews
- `GET /api/marketplace/[id]/reviews`: Fetches all reviews for a specific organization.
- `POST /api/marketplace/[id]/reviews`: Submits a new review (restricted to other organizations; self-review is blocked).

## Security & Privacy

- **Authenticated Access**: All marketplace APIs require a valid session token.
- **Row Level Security (RLS)**: 
  - Profiles are viewable by any authenticated operator.
  - Updates are restricted to the organization's owner.
  - Reviews are immutable once submitted (deletion/editing via admin only).

## Usage for Operators

1. **Opt-in**: Go to **Admin > Settings > Marketplace** to fill out your profile and appear in search results.
2. **Discover**: Browse the **Partner Marketplace** to find collaborators in specific regions.
3. **Connect**: Review peer feedback and margin rates before reaching out for partnerships.
