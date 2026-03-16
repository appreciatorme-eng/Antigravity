# End-to-End Onboarding Wizard Test Checklist

**Test Date:** 2026-03-16
**Server URL:** http://localhost:3200
**Task:** subtask-8-1 - End-to-end wizard flow verification

## Test Steps and Results

### 1. New User Sign Up and Wizard Display
- [ ] Navigate to `/onboarding` page
- [ ] Verify wizard renders without errors
- [ ] Check that step 1 (Business Basics) is displayed
- [ ] Verify progress indicator shows correct step
- **Status:** PENDING
- **Notes:**

### 2. Complete Organization Setup Step
- [ ] Fill in required organization fields
- [ ] Verify help tooltips display correctly
- [ ] Click "Next" to proceed
- [ ] Verify PostHog event `onboarding_step_completed` fires
- **Status:** PENDING
- **Notes:**

### 3. Load Sample Data
- [ ] Click "Load Sample Data" button
- [ ] Verify confirmation dialog appears
- [ ] Confirm loading
- [ ] Verify API call to `/api/onboarding/load-sample-data` succeeds
- [ ] Check that 10 trips, 4 drivers, 28 costs, 12 expenses are loaded
- [ ] Verify PostHog event `onboarding_sample_data_loaded` fires
- [ ] Navigate to trips page to verify data appears
- **Status:** PENDING
- **Notes:**

### 4. Create First Trip in Wizard
- [ ] Return to onboarding wizard (step 3 - Trip Creation)
- [ ] Select a client from dropdown
- [ ] Enter start and end dates
- [ ] Choose import mode (Saved Plans or AI Describe)
- [ ] Complete trip creation
- [ ] Verify trip is created successfully
- [ ] Click "Next" to proceed
- **Status:** PENDING
- **Notes:**

### 5. Generate First Proposal with AI
- [ ] Navigate to step 4 (Generate Proposal)
- [ ] Select a proposal template
- [ ] Enter proposal title
- [ ] Verify client and trip details display correctly
- [ ] Click "Generate Proposal with AI"
- [ ] Wait for AI generation to complete
- [ ] Verify success message appears
- [ ] Verify link to view proposal is displayed
- [ ] Click "Next" to proceed
- **Status:** PENDING
- **Notes:**

### 6. Skip WhatsApp Setup
- [ ] Navigate to step 5 (WhatsApp Setup)
- [ ] Verify WhatsApp benefits are displayed
- [ ] Verify "Skip" button is visible
- [ ] Click "Skip" button
- [ ] Verify PostHog event `onboarding_step_skipped` fires
- [ ] Verify wizard advances to next step
- **Status:** PENDING
- **Notes:**

### 7. Skip Payment Setup
- [ ] Navigate to step 6 (Payment Setup)
- [ ] Verify payment benefits are displayed
- [ ] Verify "Skip" button is visible
- [ ] Click "Skip" button
- [ ] Verify PostHog event `onboarding_step_skipped` fires
- [ ] Verify wizard advances to next step
- **Status:** PENDING
- **Notes:**

### 8. Complete Wizard and Verify PostHog Events
- [ ] Navigate to final steps (Proposal Style and Review & Launch)
- [ ] Complete remaining required steps
- [ ] Click "Complete Onboarding" or final button
- [ ] Verify PostHog event `onboarding_wizard_completed` fires
- [ ] Verify redirect to dashboard or appropriate page
- [ ] Check that wizard no longer appears on login
- **Status:** PENDING
- **Notes:**

### 9. Dismiss Wizard and Verify Resume from Settings
- [ ] Return to onboarding page before completing wizard
- [ ] Locate and click "Dismiss" button (X icon in header)
- [ ] Verify PostHog event `wizard_dismissed` fires
- [ ] Navigate to `/settings` page
- [ ] Verify "Resume Onboarding" button is visible
- [ ] Click "Resume Onboarding" button
- [ ] Verify navigation to `/onboarding` page
- **Status:** PENDING
- **Notes:**

### 10. Resume Wizard and Verify Correct Step
- [ ] After dismissing wizard at a specific step (e.g., step 3)
- [ ] Navigate away from onboarding page
- [ ] Return to `/onboarding` page
- [ ] Verify wizard resumes at the correct step (step 3)
- [ ] Verify all previously completed steps are marked as complete
- [ ] Verify skipped steps are tracked correctly
- **Status:** PENDING
- **Notes:**

## Overall Test Summary

**Tests Passed:** 0/10
**Tests Failed:** 0/10
**Tests Pending:** 10/10

## Issues Found

_List any bugs, UI issues, or unexpected behavior here_

## Recommendations

_Any suggestions for improvements or follow-up tasks_

## Sign-off

- [ ] All critical flows work as expected
- [ ] No console errors during testing
- [ ] PostHog events are tracking correctly
- [ ] Wizard can be dismissed and resumed
- [ ] Sample data loads successfully
- [ ] Skip functionality works on all optional steps

**Tester:** Auto-Claude
**Date:** 2026-03-16
**Result:** PENDING MANUAL VERIFICATION
