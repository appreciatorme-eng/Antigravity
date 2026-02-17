# Travel Suite: Comprehensive Tour Operator Workflow Guide

This guide outlines how a tour operator can leverage the Travel Suite web application to manage their entire business lifecycle, from lead acquisition to trip completion and billing.

## 1. Client Management (CRM)
**Goal:** Capture and manage client information to track leads and build relationships.

**Workflow:**
1.  **Navigate to** `/admin/clients`.
2.  **Add a New Client:** Click "Add Client".
    *   **Required Info:** Full Name, Email.
    *   **Optional Info:** Phone, Budget, Travel Style, Interests.
    *   **Status Tracking:** Set `Lead Status` (New, Contacted, Qualified) and `Lifecycle Stage` (Lead, Prospect, Active).
4.  **Edit Client Details:** Click the "Edit" icon on any client card to update their profile, including notes and preferences.
5.  **View Client Profile:** Click "View Profile" on a client card to see their trip history, detailed notes, and contact details.
6.  **Manage Lifecycle:** Move clients through stages (e.g., Lead -> Prospect -> Proposal Sent -> Active Trip) using the Kanban board or profile dropdowns. Automated emails can be triggered on stage changes.

**Recommendations:**
*   Add a "Notes" section to client profiles for keeping track of conversations.
*   Implement automated email triggers when a client moves stages (e.g., "Welcome" email for new leads).

## 2. Product Management (Templates & Add-ons)
**Goal:** Create reusable travel products to speed up proposal creation and increase revenue.

**Workflow:**
1.  **Tour Templates:**
    *   **Navigate to** `/admin/tour-templates`.
    *   **Create Template:** detailed itineraries (e.g., "7-Day Bali Retreat").
    *   **Add Days/Activities:** Structure the itinerary day-by-day.
2.  **Add-ons (Upselling):**
    *   **Navigate to** `/admin/add-ons`.
    *   **Create Add-on:** Define extra services like "Airport Transfer", "Spa Package", or "Late Checkout".
    *   **Set Price & Category:** Type a new category name (e.g., "VIP Services") or select an existing one. The system remembers your custom categories.
    *   **Usage:** These can be added to Proposals or Active Trips.

**Recommendations:**
*   Allow "cloning" of templates to create variations quickly.
*   Add image galleries to Add-ons to make them more appealing to clients.

## 3. Sales & Proposals
**Goal:** Convert leads into customers by sending beautiful, interactive proposals.

**Workflow:**
1.  **Navigate to** `/admin/proposals`.
2.  **Create Proposal:**
    *   Select a **Client**.
    *   (Optional) Select a **Tour Template** as a base.
    *   Set **Dates** and **Pricing**.
3.  **Customize Itinerary:** Edit the daily activities, add photos, and descriptions.
4.  **Add Options:** Include Add-ons for the client to select.
5.  **Send to Client:** Generate a shareable link (e.g., `/p/[proposal_id]`).
6.  **Client Interaction:**
    *   Client views proposal.
    *   Client can "Accept" or "Request Changes".

**Recommendations:**
*   Add a formal "Sign Contract" step with digital signature integration.
*   Enable clients to comment directly on specific itinerary items.

## 4. Trip Planning & Operations
**Goal:** Execute the sold trip flawlessly.

**Workflow:**
1.  **Convert to Trip:**
    *   Navigate to the approved Proposal (`/admin/proposals/[id]`).
    *   Click the **"Convert to Trip"** button at the top right.
    *   Select the **Start Date** for the trip.
    *   The system creates a new Trip, copies the itinerary and add-ons, and redirects you to the trip page.
2.  **Detailed Planning:**
    *   **Navigate to** `/admin/trips/[id]`.
    *   Refine itinerary with exact times and logistics.
3.  **Driver Assignment:**
    *   **Navigate to** `/admin/drivers` to manage your fleet/staff.
    *   Assign specific drivers to trips or specific days/transfers.
4.  **Documents:** Upload tickets, vouchers, and confirmations to the Trip Documents section.

**Recommendations:**
*   Create a "Driver App" view where drivers only see their assigned tasks.
*   Implement real-time flight tracking for airport pickups.

## 5. Financials (Billing & Payments)
**Goal:** Get paid.

**Workflow:**
1.  **Navigate to** `/admin/billing`.
2.  **Create Invoice:**
    *   Select **Client** and **Trip**.
    *   Add line items (Trip Cost, Add-ons).
    *   Set Due Date.
3.  **Record Payment:**
    *   Mark invoice as "Paid" when funds are received (or integrate Stripe/payment gateway).
4.  **Track Revenue:** View dashboard in `/admin/revenue` to see Sales vs. Revenue collected.

**Recommendations:**
*   Integrate a payment gateway (Stripe/PayPal) for direct online payments on invoices.
*   Automate "Payment Reminder" emails.

## 6. Analytics & Admin
**Goal:** Monitor business health.

**Workflow:**
1.  **Navigate to** `/admin/analytics` or `/admin`.
2.  **Review Metrics:**
    *   Total Sales / Revenue.
    *   Active Leads / Conversion Rate.
    *   Top Selling Tours / Add-ons.
3.  **Manage Team:** Add other admins or staff in Settings.

---

# Automation & Testing Strategy (Playwright)

To ensure these critical business flows work reliably, we will implement the following End-to-End (E2E) tests:

1.  **Can Create a Client:** Verify basic CRM functionality.
2.  **Can Create a Tour Template:** Verify product creation.
3.  **Can Create a Proposal from Template:** Verify the core sales flow.
4.  **Can Add Add-ons:** Verify the upselling engine.
5.  **Can Convert Proposal to Trip:** Verify the handover from sales to operations.

These tests will run automatically on every code change to prevent regressions in business-critical features.
