# Manual Testing Guide

This document outlines manual testing procedures for various features of the Travel Suite application.

## 1. Client & Driver Onboarding

### prerequisites

Before testing, ensure you have applied the latest database migration:

```bash
npx supabase db push
```

### Scenario A: New Client Signup

1.  **Action**: Launch the app and sign up with a new email as a **Client**.
2.  **Expected Behavior**:
    - After signup, you are redirected to the **Onboarding Screen**.
    - **Step 1**: Asking for Bio & WhatsApp. Fill this out.
    - **Step 2**: Asking for Dietary Requirements & Mobility Needs. Fill this out.
    - Click **Complete**.
    - You are redirected to the **Home Screen** (Trips).
    - No "Complete Profile" banner should be visible.
3.  **Validation**: Check Supabase `profiles` table. `onboarding_step` should be `2`. `client_info` should contain your answers.

### Scenario B: New Driver Signup

1.  **Action**: Launch the app and sign up with a new email as a **Driver**.
2.  **Expected Behavior**:
    - After signup, you are redirected to the **Onboarding Screen**.
    - **Step 1**: Asking for Bio & WhatsApp.
    - **Step 2**: Asking for Vehicle Info (Make/Model/Plate) & License Number.
    - Click **Complete**.
    - You are redirected to the **Home Screen**.
3.  **Validation**: Check Supabase `profiles` table. `driver_info` should contain vehicle details.

### Scenario C: Skip Onboarding

1.  **Action**: Sign up (or set `onboarding_step = 0` for a test user).
2.  **Click "Setup Later"**.
3.  **Expected Behavior**:
    - You are redirected to the **Home Screen** immediately.
    - A **"Complete your profile" banner** should appear at the top of the Trips list.
4.  **Action**: Click the banner.
5.  **Expected Behavior**:
    - You are taken back to the Onboarding Flow.
    - Complete the flow.
    - Returned to Home Screen.
    - The banner should **disappear**.
