# Tour Operator Marketplace Guide

The Tour Operator Marketplace is a B2B feature within the Travel Suite that enables tour operators (organizations) to discover, rate, and collaborate with one another.

## Core Features

- **Global Search**: Full-text search (FTS) across bios and specialties for enhanced discovery.
- **Inquiry & Inbox**: A dedicated messaging system for partnership requests with a central Inbox (`/admin/marketplace/inquiries`).
- **Email Notifications**: Real-time alerts for incoming inquiries and verification status updates via Resend.
- **Media Portfolios**: Operators can showcase their services with an image gallery.
- **Compliance Document Vault**: A secure section for legal/safety documents (Liability Insurance, Licenses) restricted to Verified Partners.
- **Integrated Rate Cards**: Structured margin rates for specific services (e.g., "10% for Trekking") to complement the baseline rate.
- **Verification Workflow**: A structured path for operators to request and receive "Verified Partner" status.

## Database Schema

### 1. `marketplace_profiles`
Extends the existing `organizations` table.
- `verification_status`: Tracks trust level (`none`, `pending`, `verified`, `rejected`).
- `search_vector`: A generated `tsvector` for optimized full-text search.
- `gallery_urls`: Array of image URLs for the media portfolio.
- `rate_card`: Array of objects defining service-specific margin rates.
- `compliance_documents`: Array of objects containing legal document metadata and URLs.

### 2. `marketplace_inquiries`
Tracks partnership requests.
- `sender_org_id`: The initiating organization.
- `receiver_org_id`: The target organization.
- `message`: Context for the partnership request.
- `status`: Tracking the request (`pending`, `accepted`, `declined`).
- `read_at`: Timestamp for when the recipient viewed the inquiry.

## API Endpoints

### Marketplace Discovery
- `GET /api/marketplace`: Now supports Full-Text Search via the `q` parameter.

### Partner Inquiries & Inbox
- `GET /api/marketplace/inquiries`: Fetches sent and received inquiries for the current organization.
- `POST /api/marketplace/[id]/inquiry`: Sends a new partnership inquiry.
- `PATCH /api/marketplace/inquiries`: Updates inquiry status or marks it as read.

### Profile & Media
- `PATCH /api/marketplace`: Updates profile details, including the `gallery_urls` and `rate_card`. Supports `request_verification: true`.

### Internal Administration (Superadmin)
- `GET /api/admin/marketplace/verify`: Lists all pending verification requests.
- `POST /api/admin/marketplace/verify`: Approves ('verified') or Rejects ('rejected') a request.

## Usage for Operators

1. **Opt-in & Showcase**: Go to **Admin > Settings > Marketplace** to fill out your bio, upload gallery images, and define your Service Rate Card.
2. **Discover**: Browse the **Partner Marketplace** to find collaborators. Use the Search bar to find specific niches (e.g., "Bali Guided Tours").
3. **Connect**: Send a partnership inquiry. Manage incoming requests in your **Marketplace Inbox**.
4. **Build Trust**: Request verification to earn the "Verified Partner" badge and collect positive peer reviews from collaborators.
