# Tour Operator Marketplace Guide

The Tour Operator Marketplace is a B2B feature within the Travel Suite that enables tour operators (organizations) to discover, rate, and collaborate with one another.

## Overview

Unlike the public-facing parts of the application, the Marketplace is an **internal discovery layer** for registered organizations. It allows operators to find partners based on their service regions, specialties, and professional ratings.

## Database Schema

The marketplace functionality is built on two primary tables:

### 1. `marketplace_profiles`
Extends the existing `organizations` table with marketplace-specific metadata.
- `organization_id`: Links to the core organization record.
- `description`: A professional bio or capability statement.
- `service_regions`: A JSONB array of geographic areas covered (e.g., `["Bali", "Thailand"]`).
- `specialties`: A JSONB array of niche expertise (e.g., `["Luxury", "Eco-tourism"]`).
- `margin_rate`: The baseline partnership margin offered to other operators.
- `is_verified`: An admin-controlled flag for trusted partners.

### 2. `marketplace_reviews`
A peer-to-peer feedback system.
- `reviewer_org_id`: The organization providing the feedback.
- `target_org_id`: The organization being reviewed.
- `rating`: A numeric score from 1-5.
- `comment`: Detailed text feedback.

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
