# Suite S17: Payment — Invoice Studio & Razorpay Integration

**Category**: Functional
**Duration**: ~4 min
**Requires Auth**: Yes

## What It Tests

Navigates to the Invoice Studio and verifies the invoice creation form renders. Checks for client field, amount fields, and Razorpay-related elements (payment link generation, Razorpay branding). Verifies the invoice list loads.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Step 1: Navigate to Invoice Studio ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/invoices"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s17-payment/invoice-studio.png"

# Check invoice page structure
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasError: document.body.innerText.includes('Something went wrong'), hasInvoiceContent: document.body.innerText.includes('Invoice') || document.body.innerText.includes('invoice'), hasCreateButton: !!Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Create') || b.textContent?.includes('New')), url: window.location.href })"

# --- Step 2: Check for invoice form elements ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ forms: document.querySelectorAll('form, [role=\"form\"]').length, inputs: Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({ name: i.name || i.getAttribute('aria-label') || i.placeholder || i.id, type: i.type })).slice(0, 15), hasClientField: !!document.querySelector('[name*=\"client\" i], [placeholder*=\"client\" i], [aria-label*=\"client\" i]'), hasAmountField: !!document.querySelector('[name*=\"amount\" i], [placeholder*=\"amount\" i], [aria-label*=\"amount\" i], [name*=\"price\" i]') })"

# --- Step 3: Check for Razorpay integration elements ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasRazorpayRef: document.body.innerText.includes('Razorpay') || document.body.innerText.includes('razorpay'), hasPaymentLink: document.body.innerText.includes('Payment Link') || document.body.innerText.includes('payment link'), hasPayButton: !!Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toLowerCase().includes('pay') || b.textContent?.toLowerCase().includes('send')), hasINRSymbol: document.body.innerText.includes('INR') || document.body.innerText.includes('Rs') || document.body.innerText.includes('₹') })"

# --- Step 4: Check invoice list ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasTable: document.querySelectorAll('table, [role=\"table\"], [role=\"grid\"]').length > 0, hasCards: document.querySelectorAll('[class*=\"card\"], [class*=\"Card\"]').length > 0, hasEmptyState: document.body.innerText.includes('No invoices') || document.body.innerText.includes('no invoices') || document.body.innerText.includes('Get started'), listItems: document.querySelectorAll('tr, [role=\"row\"]').length })"

# --- Step 5: Try to interact with client field ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s17-payment/invoice-form.png"

# --- Step 6: Navigate to billing page (subscription/payment context) ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/billing"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s17-payment/billing.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasError: document.body.innerText.includes('Something went wrong'), hasPlanInfo: document.body.innerText.includes('Plan') || document.body.innerText.includes('plan'), hasUpgrade: document.body.innerText.includes('Upgrade') || document.body.innerText.includes('upgrade') })"

# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error
```

## Pass Criteria

- Invoice Studio loads without error boundary
- Invoice form has client and amount fields
- INR currency references present (₹, Rs, or INR)
- Invoice list or empty state renders
- Billing page loads without errors
- No console errors on payment pages

## Issue Detection

- **P0 Critical**: Invoice Studio shows error boundary
- **P1 High**: Invoice form missing client or amount fields
- **P1 High**: No INR/Razorpay references — payment integration may be broken
- **P2 Medium**: Invoice list fails to load (but form works)
- **P2 Medium**: Billing page shows error
- **P3 Low**: Missing payment link generation button
- Reference: severity-rules.md
