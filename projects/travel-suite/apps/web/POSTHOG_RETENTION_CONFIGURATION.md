# PostHog 7-Day Retention Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring 7-day retention tracking in PostHog for the onboarding wizard completion event.

## Event Details

**Event Name:** `wizard_completed`

**Event Properties:**
- None (simple completion event)

**Tracked In Code:**
- File: `projects/travel-suite/apps/web/src/lib/analytics/events.ts`
- Method: `wizardCompleted()`
- Triggered: When user completes the final step of the onboarding wizard

**Usage Location:**
- File: `projects/travel-suite/apps/web/src/app/onboarding/page.tsx`
- Line 285: Called in `handleSubmit()` function after successful review step submission

### Alternative Enhanced Event (Not Currently Used)

A more detailed event `onboarding_wizard_completed` is available in the codebase but not currently integrated:

- File: `projects/travel-suite/apps/web/src/lib/analytics/onboarding-events.ts`
- Properties: `total_steps`, `completed_steps`, `skipped_steps`
- **Status:** Defined but not actively tracked (use `wizard_completed` for retention analysis)

## PostHog Dashboard Configuration

### Step 1: Access PostHog Dashboard

1. Navigate to [https://app.posthog.com](https://app.posthog.com)
2. Log in with your organization credentials
3. Select the correct project (should match `NEXT_PUBLIC_POSTHOG_KEY` environment variable)

### Step 2: Create Retention Cohort

1. **Navigate to Insights**
   - Click on "Product Analytics" in the left sidebar
   - Click on "Retention" tab

2. **Create New Retention Insight**
   - Click "New Insight" button
   - Select "Retention" as the insight type

3. **Configure the Cohort**

   **First Event (Activation Event):**
   - Event: `wizard_completed`
   - Description: "User completes onboarding wizard"

   **Return Event (Retention Event):**
   - Event: Any active event (e.g., `$pageview`, `proposal_created`, `trip_created`)
   - Description: "User returns and performs any action"

   **Time Period:**
   - Retention period: **7 days**
   - Display type: "Day 0, Day 1, Day 2... Day 7"

   **Cohort Settings:**
   - Cohort by: "All users" or specific user properties if needed
   - Date range: "Last 30 days" (adjust as needed)

4. **Add Filters (Optional)**

   To analyze retention by user segments:
   ```
   - Filter by user properties (e.g., organization size, industry)
   - Compare with users who triggered sample_data_loaded
   - Segment by time to complete wizard (if tracking timestamps)
   ```

5. **Save the Insight**
   - Click "Save" button
   - Name: "Onboarding Wizard 7-Day Retention"
   - Description: "Tracks user retention 7 days after completing the onboarding wizard"
   - Add to dashboard: Select main product dashboard

### Step 3: Set Up Dashboard Widget

1. **Create or Select Dashboard**
   - Navigate to "Dashboards" in left sidebar
   - Create new dashboard or select existing "Product Metrics" dashboard

2. **Add Retention Widget**
   - Click "Add insight" on dashboard
   - Select the "Onboarding Wizard 7-Day Retention" insight created above
   - Position it prominently on the dashboard

3. **Configure Auto-Refresh**
   - Set refresh interval: Daily
   - Enable email notifications for significant changes

### Step 4: Set Up Alerts (Recommended)

1. **Navigate to Alerts**
   - Go to Settings → Alerts
   - Click "New Alert"

2. **Configure Alert**
   - Name: "Low Onboarding Retention Alert"
   - Insight: "Onboarding Wizard 7-Day Retention"
   - Trigger when: "7-day retention drops below 40%"
   - Send to: Product team email/Slack channel
   - Frequency: Daily check

### Step 5: Verify Data is Flowing

1. **Check Recent Events**
   - Navigate to "Activity" → "Live Events"
   - Filter by event name: `wizard_completed`
   - Verify events are being received

2. **Test Event Capture (Development)**
   ```bash
   # In browser console (during wizard completion)
   posthog.capture("wizard_completed", {})
   ```

3. **Validate Event in Live Events**
   - Click on a recent `wizard_completed` event in Live Events
   - Verify event is captured when wizard is completed
   - Note: This event has no additional properties (simple completion marker)

## Expected Retention Targets

Based on industry benchmarks for SaaS onboarding:

| Metric | Target | Excellent | Poor |
|--------|--------|-----------|------|
| Day 1 Retention | 60% | 75%+ | <40% |
| Day 7 Retention | 40% | 50%+ | <25% |
| Day 30 Retention | 25% | 35%+ | <15% |

**Success Criteria (from spec.md):**
> Users who complete the wizard have a measurable higher 7-day retention rate (tracked via PostHog)

**Baseline Comparison:**
- Compare 7-day retention of users who completed wizard vs. users who skipped/dismissed
- Target: Wizard completers should have 15-20% higher retention than non-completers

## Related Events to Track

For comprehensive onboarding analytics, also monitor these events:

| Event Name | Purpose | Tracked In |
|------------|---------|------------|
| `step_viewed` | Track which steps users see | `events.ts` |
| `step_completed` | Track step completion rate | `events.ts` |
| `step_skipped` | Identify commonly skipped steps | `events.ts` |
| `sample_data_loaded` | Track sample data usage | `events.ts` |
| `wizard_dismissed` | Track wizard abandonment | `events.ts` |

## Cohort Segmentation (Advanced)

Create user cohorts based on onboarding behavior:

1. **Wizard Completers**
   - Filter: Users who triggered `wizard_completed` event
   - Expected retention: Highest group

2. **Wizard Dismissers**
   - Filter: Users who triggered `wizard_dismissed` event but NOT `wizard_completed`
   - Expected retention: Lower than completers

3. **Sample Data Users**
   - Filter: Users who triggered `sample_data_loaded` event
   - Expected retention: Moderate (learning mode)

4. **Step Analysis**
   - Use `step_viewed`, `step_completed`, and `step_skipped` events
   - Analyze which steps correlate with higher retention

## Troubleshooting

### Events Not Appearing

**Check 1: PostHog Key Configuration**
```bash
# Verify env variable is set (should be in Vercel dashboard)
echo $NEXT_PUBLIC_POSTHOG_KEY
```

**Check 2: Client-Side PostHog Initialization**
- File: `src/components/analytics/PostHogProvider.tsx`
- Line 34-38: Verify `posthog.init()` is called
- Check browser console for PostHog initialization errors

**Check 3: Network Requests**
- Open browser DevTools → Network tab
- Filter by "posthog.com"
- Verify POST requests to `/e/` endpoint with event data

### Retention Data Not Calculating

**Issue:** Retention shows 0% or "No data"

**Solution 1: Insufficient Time**
- Retention requires at least 7 days of data after first completions
- Check "Date Range" in retention insight

**Solution 2: No Return Events**
- Verify return event is common enough (use `$pageview` as safe default)
- Check that identified users are returning (session tracking)

**Solution 3: Cohort Too Small**
- Need minimum ~30 users for statistical significance
- Consider extending date range or using staging data

### Event Properties Missing

**Check:** Event structure in code
```typescript
// Current implementation (simple completion marker):
posthog.capture("wizard_completed", {})

// Location: src/lib/analytics/events.ts line 31-32
// Called from: src/app/onboarding/page.tsx line 285
```

## Verification Checklist

Mark each item when verified:

- [ ] PostHog dashboard accessible at app.posthog.com
- [ ] Correct project selected (matches NEXT_PUBLIC_POSTHOG_KEY)
- [ ] `wizard_completed` events visible in Live Events
- [ ] Retention insight created with 7-day period
- [ ] First event: `wizard_completed`
- [ ] Return event: configured (e.g., `$pageview`)
- [ ] Retention insight saved and named: "Onboarding Wizard 7-Day Retention"
- [ ] Retention insight added to main dashboard
- [ ] Alert configured for retention drops below 40%
- [ ] At least 7 days of data collected before final validation
- [ ] Baseline comparison: wizard completers vs. non-completers shows positive delta

## Additional Resources

- [PostHog Retention Documentation](https://posthog.com/docs/user-guides/retention)
- [PostHog Cohorts Guide](https://posthog.com/docs/user-guides/cohorts)
- [PostHog Alerts Documentation](https://posthog.com/docs/user-guides/alerts)

## Questions or Issues?

If you encounter issues configuring the retention cohort:

1. Check PostHog status page: [status.posthog.com](https://status.posthog.com)
2. Review PostHog docs: [posthog.com/docs](https://posthog.com/docs)
3. Contact PostHog support via in-app chat
4. Verify event implementation in codebase (this guide's code references)

---

**Document Version:** 1.0
**Last Updated:** 2026-03-16
**Maintained By:** Engineering Team
**Related Spec:** `.auto-claude/specs/004-guided-onboarding-wizard-enhancement/spec.md`
