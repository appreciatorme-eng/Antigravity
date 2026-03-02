# Tour Operator FAQ (Simple Language)

This FAQ is written for tour operators and staff. It avoids technical wording.

## Trips and Itineraries

### 1) How do I create a new trip?
Go to Trips and click **New Trip**. Pick the client, dates, and destination. You can generate an itinerary with AI or start from scratch.

### 2) Can I search trips quickly?
Yes. You can search by destination, client name, or trip title.

### 3) What do trip statuses mean?
- **Draft**: not finalized yet.  
- **Pending**: waiting for confirmations.  
- **Confirmed**: ready and approved.  
- **Completed**: trip finished.  
- **Cancelled**: trip is no longer active.

### 4) Can I share an itinerary with my client?
Yes. You can generate a share link and send it to the client.

### 5) Does the share link expire?
Yes, shared links can expire based on your app settings.

### 6) Can I export a trip as PDF?
Yes. You can download itinerary PDF files and send them directly to clients.

### 7) Can I update itinerary pricing later?
Yes. You can update pricing any time. The assistant can help with this after you confirm the exact trip.

### 8) Can I update one specific day only?
Yes. You can ask to update day-level details like hotel, activity, or transport.

## Clients and Pipeline

### 9) How do I add a new client?
Go to Clients and click **Add Client**. Name and email are required. Other details are optional.

### 10) What client details should I fill first?
Start with contact info, preferred destination, budget range, and travel style.

### 11) What are lifecycle stages?
Stages show where the client is in your sales/trip journey: Lead, Prospect, Proposal, Payment Pending, Payment Confirmed, Active, Review, Closed.

### 12) Can I move clients between stages?
Yes. You can move them from one stage to another in the client view or Kanban board.

### 13) What is the Kanban board used for?
It helps you track client progress visually and quickly move people to the next stage.

### 14) What does "Payment Pending" mean?
It means client interest is real, but payment has not been completed yet.

### 15) What does "Payment Confirmed" mean?
Payment is received and the booking can continue to operations.

### 16) Can I tag clients?
Yes. You can use tags like VIP, Repeat, Corporate, Family, Honeymoon, or High Priority.

### 17) Can I turn off stage notifications for one client?
Yes. Per-client stage notifications can be switched on or off.

### 18) What is a pre-lead contact?
A contact that is not yet a full lead. You can import contacts and move them to lead when ready.

### 19) Can I import contacts from phone or CSV?
Yes. Both options are available in Kanban/contacts flow.

## Notifications and WhatsApp

### 20) Can I send updates automatically when stage changes?
Yes. You can control this in notification rules.

### 21) Where do I see notification history?
In the Notifications section. You can filter and search all logs.

### 22) What statuses will I see in notifications?
Common statuses include Pending, Sent, Delivered, and Failed.

### 23) Can failed notifications be retried?
Yes. You can retry failed queue items.

### 24) Can I send reminders to clients by WhatsApp?
Yes, if WhatsApp setup and templates are configured.

### 25) Why did a WhatsApp message fail?
Usually because of template issues, phone mapping problems, or channel restrictions. Check the error in logs.

### 26) What is phone mapping for drivers?
It matches incoming WhatsApp driver messages to the correct driver profile.

### 27) Can I fix driver phone mapping from admin?
Yes. You can fix one driver or all drivers from the notification/health tools.

## Drivers and Operations

### 28) Can I assign drivers to trips?
Yes. Driver assignment is supported in trip operations.

### 29) Can I detect driver scheduling conflicts?
Yes. The system supports conflict-aware assignment workflows.

### 30) Can clients get live location links?
Yes. Token-based live location sharing is available for active trip days.

### 31) Can expired live links be cleaned up?
Yes. There are cleanup tools for expired live links.

### 32) What is a stale driver trip?
A trip where expected driver updates are not fresh. This is shown in health diagnostics.

## Billing and Business

### 33) Can I see subscription plans?
Yes. Billing page shows plan options and feature tiers.

### 34) Can I update payment method?
Yes, billing settings include payment method updates.

### 35) Can I track payment-related client stage changes?
Yes. Payment stages are part of lifecycle tracking and can trigger notifications.

## Daily Operations Questions (for chatbot)

### 36) "What is pending today?"
The assistant should return pending notifications, pending payment clients, and upcoming operations due soon.

### 37) "Which clients are waiting for payment?"
The assistant should return clients in **Payment Pending** stage for your organization.

### 38) "Which trips need attention this week?"
The assistant should return trips in pending/draft status and stale operation signals.

### 39) "Move this client to payment confirmed"
The assistant can do this after confirming the exact client name and stage change.

### 40) "Update itinerary price for this client"
The assistant can do this after confirming trip, currency, and final amount.

### 41) "Who is my highest priority client right now?"
The assistant should prioritize clients tagged High Priority and those with urgent pending actions.

### 42) "Show me notification failures"
The assistant should return failed items, reason, and suggested retry actions.

### 43) "Which driver is not mapped correctly?"
The assistant should return drivers missing phone mapping and suggest one-click fixes.

### 44) "How many leads moved this week?"
The assistant should summarize stage transitions from activity logs.

### 45) "What changed in this trip?"
The assistant should summarize latest updates in itinerary, assignment, and status.

## Invoices

### 46) Can I generate an invoice for a client?
Yes. Invoices can be generated from a confirmed trip and sent directly to the client.

### 47) Can I send an invoice by WhatsApp?
Yes. If WhatsApp is connected, invoices can be sent as a message to the client's WhatsApp number.

### 48) Can I track which invoices are unpaid?
Yes. Invoice status is tracked so you can see which clients have outstanding payments.

## Add-ons and Tour Templates

### 49) What are add-ons?
Add-ons are extra services you can offer clients, like airport transfers, spa packages, or late checkout. You can set a price and category for each.

### 50) How do I add an add-on to a trip?
Go to the trip or proposal and select from your add-ons list. Add-ons can be attached to proposals or active trips.

### 51) What are tour templates?
Tour templates are reusable itineraries, like a "7-Day Bali Retreat". You can create them once and use them to build new trips faster.

### 52) Can I clone a tour template?
Yes. You can duplicate a template and modify it to create variations quickly.

## Media Library

### 53) Where do WhatsApp images I receive go?
Images sent to your business WhatsApp number are automatically saved to your Media Library under the sender's organization.

### 54) Can I use media library images in social posts?
Yes. The media library is shared with the social studio so you can use uploaded images in content creation.

## Live Location Sharing

### 55) How does live location sharing work?
When a trip is active, your clients can receive a link that shows their driver's real-time location. The link is token-based and expires after the trip day.

### 56) Can expired live location links be cleaned up?
Yes. The system has cleanup tools to remove expired live location tokens.
