# QA Flows — Antigravity Travel Suite

Use playwright-cli to run these flows. Start the dev server first (`npm run dev`),
then ask Claude Code to run any tier below.

Base URL: `http://localhost:3000`

---

## Tier 1 — Auth & Access

### T1-1: Valid Login → Admin Dashboard
```
playwright-cli open http://localhost:3000/auth
playwright-cli snapshot
playwright-cli fill [email] TEST_ADMIN_EMAIL
playwright-cli fill [password] TEST_ADMIN_PASSWORD
playwright-cli click [sign-in button]
playwright-cli snapshot
# EXPECT: URL is /admin, dashboard content visible
playwright-cli screenshot
```

### T1-2: Invalid Login → Error Shown, No Redirect
```
playwright-cli open http://localhost:3000/auth
playwright-cli fill [email] wrong@example.com
playwright-cli fill [password] wrongpassword
playwright-cli click [sign-in button]
playwright-cli snapshot
# EXPECT: error message visible, URL still /auth
playwright-cli screenshot
```

### T1-3: Unauthenticated Access → Redirect to /auth
```
playwright-cli open http://localhost:3000/admin
playwright-cli snapshot
# EXPECT: redirected to /auth
```

### T1-4: Logout → Session Cleared
```
# (assumes logged in from T1-1)
playwright-cli goto http://localhost:3000/auth/signout
playwright-cli snapshot
# EXPECT: redirected to home (/), no session
playwright-cli goto http://localhost:3000/admin
playwright-cli snapshot
# EXPECT: redirected to /auth again
```

---

## Tier 2 — Core CRUD

### T2-1: Trip CRUD
```
# CREATE
playwright-cli open http://localhost:3000/admin
playwright-cli click [Trips nav link]
playwright-cli click [New Trip / Create button]
playwright-cli fill [trip name] "QA Test Trip"
playwright-cli fill [destination] "Bali, Indonesia"
playwright-cli click [Save / Create]
playwright-cli snapshot
# EXPECT: new trip appears in list

# VIEW
playwright-cli click [QA Test Trip in list]
playwright-cli snapshot
# EXPECT: trip detail page with name "QA Test Trip"

# DELETE
playwright-cli click [Delete button]
playwright-cli dialog-accept
playwright-cli snapshot
# EXPECT: trip no longer in list
```

### T2-2: Client CRUD
```
# CREATE
playwright-cli goto http://localhost:3000/clients
playwright-cli click [Add Client / New Client button]
playwright-cli fill [name] "QA Test Client"
playwright-cli fill [email] "qaclient@test.com"
playwright-cli click [Save]
playwright-cli snapshot
# EXPECT: client appears in list

# VIEW
playwright-cli click [QA Test Client]
playwright-cli snapshot
# EXPECT: client profile page

# DELETE
playwright-cli click [Delete]
playwright-cli dialog-accept
playwright-cli snapshot
# EXPECT: client no longer in list
```

### T2-3: Tour Template CRUD
```
# CREATE
playwright-cli goto http://localhost:3000/admin/tour-templates
playwright-cli click [Create Template button]
playwright-cli fill [template name] "QA Test Template"
playwright-cli click [Save]
playwright-cli snapshot
# EXPECT: template in list

# EDIT
playwright-cli click [QA Test Template]
playwright-cli click [Edit]
playwright-cli fill [template name] "QA Test Template Updated"
playwright-cli click [Save]
playwright-cli snapshot
# EXPECT: updated name shows

# DELETE
playwright-cli click [Delete]
playwright-cli dialog-accept
playwright-cli snapshot
# EXPECT: template removed from list
```

### T2-4: Proposal Create + Send
```
# CREATE
playwright-cli goto http://localhost:3000/proposals/create
playwright-cli fill [client name/search] "QA Test Client"
playwright-cli fill [trip name] "QA Proposal Trip"
playwright-cli click [Save Draft]
playwright-cli snapshot
# EXPECT: proposal created, shows in proposals list

# SEND
playwright-cli click [Send Proposal]
playwright-cli snapshot
# EXPECT: confirmation that proposal sent, public link visible
```

### T2-5: Add-on CRUD
```
# CREATE
playwright-cli goto http://localhost:3000/add-ons
playwright-cli click [New Add-on button]
playwright-cli fill [name] "QA Airport Transfer"
playwright-cli fill [price] "50"
playwright-cli click [Save]
playwright-cli snapshot
# EXPECT: add-on in list

# DELETE
playwright-cli click [QA Airport Transfer]
playwright-cli click [Delete]
playwright-cli dialog-accept
playwright-cli snapshot
# EXPECT: add-on removed
```

---

## Tier 3 — Key Business Workflows

### T3-1: Full Sales Pipeline
```
# Step 1: Create client
playwright-cli goto http://localhost:3000/clients
playwright-cli click [Add Client]
playwright-cli fill [name] "Pipeline Test Client"
playwright-cli fill [email] "pipeline@test.com"
playwright-cli click [Save]

# Step 2: Create proposal for that client
playwright-cli goto http://localhost:3000/proposals/create
playwright-cli fill [client] "Pipeline Test Client"
playwright-cli fill [trip] "Pipeline Test Trip"
playwright-cli click [Save Draft]

# Step 3: Convert to booking
playwright-cli click [Convert to Booking]
playwright-cli snapshot
# EXPECT: booking created, booking detail page shown

playwright-cli screenshot
```

### T3-2: Invoice Flow
```
# (assumes booking exists from T3-1)
playwright-cli goto http://localhost:3000/admin/invoices
playwright-cli click [New Invoice / Generate Invoice]
playwright-cli snapshot
# EXPECT: invoice created with booking details

playwright-cli screenshot --filename=invoice-created.png
```

---

## Tier 4 — Negative / Edge Cases

### T4-1: Create Trip Without Required Fields
```
playwright-cli goto http://localhost:3000/trips
playwright-cli click [New Trip]
playwright-cli click [Save]  # submit empty form
playwright-cli snapshot
# EXPECT: validation error messages, NOT redirected
playwright-cli screenshot --filename=validation-errors.png
```

### T4-2: Delete Button Actually Deletes (Not Just Closes Modal)
```
# Create something first, then:
playwright-cli click [Delete button]
playwright-cli snapshot
# EXPECT: confirmation dialog appears
playwright-cli dialog-accept
playwright-cli snapshot
# EXPECT: item gone from list (not just modal closed)
```

### T4-3: Admin-Only Routes Blocked for Regular Users
```
# Login as regular client user first, then:
playwright-cli goto http://localhost:3000/god
playwright-cli snapshot
# EXPECT: 403, redirect, or error page — NOT god dashboard

playwright-cli goto http://localhost:3000/admin/pricing
playwright-cli snapshot
# EXPECT: redirected away or 403
```

---

## Quick Smoke Test (run all Tier 1 + key Tier 2 in one session)

Ask Claude Code:
> "Use playwright-cli to run a quick smoke test of the Antigravity travel suite at localhost:3000.
> Test: login with admin credentials, verify dashboard loads, create a trip, delete it, logout.
> Screenshot each step and report any failures."
