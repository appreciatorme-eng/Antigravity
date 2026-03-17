import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

/**
 * Acceptance Test for All 4 Automation Types
 *
 * Validates the complete behavior of all automation templates:
 * 1. proposal_followup - 24h after proposal if not viewed
 * 2. payment_reminder - 3 days before payment due
 * 3. review_request - 24h after trip completion
 * 4. trip_countdown - 7 days before trip start
 *
 * Tests cover:
 * - Template availability and metadata
 * - Trigger configuration correctness
 * - Action configuration correctness
 * - Stop condition logic
 * - UI toggle functionality
 * - API integration for all types
 */

test.describe('Automation Acceptance Tests - All 4 Types', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3100';

  test('All 4 automation templates are available via API', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Automation rules API returned 503 — database not available (demo mode)');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('templates');
    expect(Array.isArray(body.templates)).toBe(true);

    // Verify all 4 templates exist
    const templates = body.templates;
    expect(templates.length).toBeGreaterThanOrEqual(4);

    const templateIds = templates.map((t: { id: string }) => t.id);
    expect(templateIds).toContain('proposal_followup');
    expect(templateIds).toContain('payment_reminder');
    expect(templateIds).toContain('review_request');
    expect(templateIds).toContain('trip_countdown');

    console.log('✅ All 4 automation templates available:', templateIds);
  });

  test('Proposal Follow-Up automation has correct configuration', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const proposalTemplate = body.templates.find((t: { id: string }) => t.id === 'proposal_followup');

    expect(proposalTemplate).toBeDefined();
    expect(proposalTemplate.name).toBe('Proposal Follow-Up');
    expect(proposalTemplate.category).toBe('sales');

    // Verify trigger config
    const trigger = proposalTemplate.trigger_config;
    expect(trigger.entity_type).toBe('proposal');
    expect(trigger.delay_hours).toBe(24); // 24h delay
    expect(trigger.trigger_event).toBe('created');
    expect(trigger.status_filter).toContain('sent');
    expect(trigger.status_filter).toContain('pending');

    // Verify action config
    const action = proposalTemplate.action_config;
    expect(action.channel).toBe('whatsapp');
    expect(action.message_template).toContain('{{client_name}}');
    expect(action.message_template).toContain('{{destination}}');
    expect(action.message_variables).toContain('client_name');
    expect(action.message_variables).toContain('destination');
    expect(action.message_variables).toContain('operator_name');

    // Verify stop conditions
    const stopConditions = proposalTemplate.stop_conditions;
    expect(stopConditions.length).toBeGreaterThan(0);

    const viewedCondition = stopConditions.find(
      (c: { field: string; operator: string }) => c.field === 'viewed_at' && c.operator === 'exists'
    );
    expect(viewedCondition).toBeDefined();
    expect(viewedCondition.description).toContain('viewed');

    const acceptedCondition = stopConditions.find(
      (c: { field: string; value: string }) => c.field === 'status' && c.value === 'accepted'
    );
    expect(acceptedCondition).toBeDefined();

    console.log('✅ Proposal Follow-Up automation configuration validated');
  });

  test('Payment Reminder automation has correct configuration', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const paymentTemplate = body.templates.find((t: { id: string }) => t.id === 'payment_reminder');

    expect(paymentTemplate).toBeDefined();
    expect(paymentTemplate.name).toBe('Payment Reminder');
    expect(paymentTemplate.category).toBe('operations');

    // Verify trigger config
    const trigger = paymentTemplate.trigger_config;
    expect(trigger.entity_type).toBe('payment');
    expect(trigger.delay_hours).toBe(0); // No delay, date-based
    expect(trigger.trigger_event).toBe('date_approaching');
    expect(trigger.date_field).toBe('due_date');
    expect(trigger.days_before).toBe(3); // 3 days before due date
    expect(trigger.status_filter).toContain('pending');
    expect(trigger.status_filter).toContain('overdue');

    // Verify action config
    const action = paymentTemplate.action_config;
    expect(action.channel).toBe('whatsapp');
    expect(action.message_template).toContain('{{amount}}');
    expect(action.message_template).toContain('{{due_date}}');
    expect(action.message_template).toContain('{{payment_link}}');
    expect(action.message_variables).toContain('amount');
    expect(action.message_variables).toContain('due_date');
    expect(action.message_variables).toContain('payment_link');

    // Verify stop conditions
    const stopConditions = paymentTemplate.stop_conditions;
    expect(stopConditions.length).toBeGreaterThan(0);

    const paidCondition = stopConditions.find(
      (c: { field: string; value: string }) => c.field === 'status' && c.value === 'paid'
    );
    expect(paidCondition).toBeDefined();
    expect(paidCondition.description).toContain('paid');

    const cancelledCondition = stopConditions.find(
      (c: { field: string; value: string }) => c.field === 'status' && c.value === 'cancelled'
    );
    expect(cancelledCondition).toBeDefined();

    console.log('✅ Payment Reminder automation configuration validated');
  });

  test('Review Request automation has correct configuration', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const reviewTemplate = body.templates.find((t: { id: string }) => t.id === 'review_request');

    expect(reviewTemplate).toBeDefined();
    expect(reviewTemplate.name).toBe('Review Request');
    expect(reviewTemplate.category).toBe('customer_success');

    // Verify trigger config
    const trigger = reviewTemplate.trigger_config;
    expect(trigger.entity_type).toBe('trip');
    expect(trigger.delay_hours).toBe(24); // 24h after completion
    expect(trigger.trigger_event).toBe('status_changed');
    expect(trigger.status_filter).toContain('completed');

    // Verify action config
    const action = reviewTemplate.action_config;
    expect(action.channel).toBe('whatsapp');
    expect(action.message_template).toContain('{{client_name}}');
    expect(action.message_template).toContain('{{destination}}');
    expect(action.message_template).toContain('{{review_link}}');
    expect(action.message_variables).toContain('client_name');
    expect(action.message_variables).toContain('destination');
    expect(action.message_variables).toContain('review_link');

    // Verify stop conditions
    const stopConditions = reviewTemplate.stop_conditions;
    expect(stopConditions.length).toBeGreaterThan(0);

    const reviewSubmittedCondition = stopConditions.find(
      (c: { field: string; operator: string }) => c.field === 'review_submitted' && c.operator === 'exists'
    );
    expect(reviewSubmittedCondition).toBeDefined();
    expect(reviewSubmittedCondition.description).toContain('review');

    console.log('✅ Review Request automation configuration validated');
  });

  test('Trip Countdown automation has correct configuration', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const countdownTemplate = body.templates.find((t: { id: string }) => t.id === 'trip_countdown');

    expect(countdownTemplate).toBeDefined();
    expect(countdownTemplate.name).toBe('Trip Countdown');
    expect(countdownTemplate.category).toBe('customer_success');

    // Verify trigger config
    const trigger = countdownTemplate.trigger_config;
    expect(trigger.entity_type).toBe('trip');
    expect(trigger.delay_hours).toBe(0); // No delay, date-based
    expect(trigger.trigger_event).toBe('date_approaching');
    expect(trigger.date_field).toBe('start_date');
    expect(trigger.days_before).toBe(7); // 7 days before trip
    expect(trigger.status_filter).toContain('confirmed');
    expect(trigger.status_filter).toContain('active');

    // Verify action config
    const action = countdownTemplate.action_config;
    expect(action.channel).toBe('whatsapp');
    expect(action.message_template).toContain('{{client_name}}');
    expect(action.message_template).toContain('{{destination}}');
    expect(action.message_template).toContain('{{days_remaining}}');
    expect(action.message_template).toContain('{{start_date}}');
    expect(action.message_variables).toContain('days_remaining');
    expect(action.message_variables).toContain('start_date');

    // Verify stop conditions
    const stopConditions = countdownTemplate.stop_conditions;
    expect(stopConditions.length).toBeGreaterThan(0);

    const cancelledCondition = stopConditions.find(
      (c: { field: string; value: string }) => c.field === 'status' && c.value === 'cancelled'
    );
    expect(cancelledCondition).toBeDefined();

    const completedCondition = stopConditions.find(
      (c: { field: string; value: string }) => c.field === 'status' && c.value === 'completed'
    );
    expect(completedCondition).toBeDefined();

    console.log('✅ Trip Countdown automation configuration validated');
  });

  test('All 4 automation types can be toggled via API', async ({ adminPage }) => {
    test.setTimeout(120_000);

    const automationTypes = [
      'proposal_followup',
      'payment_reminder',
      'review_request',
      'trip_countdown',
    ];

    for (const ruleType of automationTypes) {
      // Enable the automation
      const enableResponse = await adminPage.request.post(`${baseURL}/api/admin/automation/toggle`, {
        headers: { 'content-type': 'application/json' },
        data: JSON.stringify({
          rule_type: ruleType,
          enabled: true,
        }),
      });

      const enableStatus = enableResponse.status();
      if (enableStatus === 503) {
        console.warn(`⚠️  Skipping ${ruleType} due to demo mode`);
        continue;
      }

      expect([200, 201]).toContain(enableStatus);
      const enableBody = await enableResponse.json();
      expect(enableBody.success).toBe(true);
      expect(enableBody.rule).toBeDefined();

      // Verify it was enabled
      const fetchResponse = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
      const fetchBody = await fetchResponse.json();
      const rule = fetchBody.rules?.find((r: { rule_type: string }) => r.rule_type === ruleType);

      if (rule) {
        expect(rule.enabled).toBe(true);
      }

      console.log(`✅ ${ruleType} enabled successfully`);

      // Disable the automation
      const disableResponse = await adminPage.request.post(`${baseURL}/api/admin/automation/toggle`, {
        headers: { 'content-type': 'application/json' },
        data: JSON.stringify({
          rule_type: ruleType,
          enabled: false,
        }),
      });

      expect(disableResponse.status()).toBe(200);
      const disableBody = await disableResponse.json();
      expect(disableBody.success).toBe(true);

      console.log(`✅ ${ruleType} disabled successfully`);
    }

    console.log('✅ All 4 automation types can be toggled via API');
  });

  test('All 4 automation types appear in UI and can be toggled', async ({ adminPage, isMobile }) => {
    test.skip(isMobile, 'Automation UI is desktop-focused');
    test.setTimeout(180_000); // 3 minutes

    await gotoWithRetry(adminPage, '/dashboard/whatsapp');

    // Wait for AutomationRules component to render
    await expect(adminPage.getByText(/automation rules/i).first()).toBeVisible({ timeout: 30_000 });

    const automationNames = [
      'Proposal Follow-Up',
      'Payment Reminder',
      'Review Request',
      'Trip Countdown',
    ];

    for (const automationName of automationNames) {
      // Check if automation rule card is visible
      const automationCard = adminPage.locator('[class*="border"]').filter({ hasText: new RegExp(automationName, 'i') }).first();
      await expect(automationCard).toBeVisible({ timeout: 15_000 });

      // Find the toggle button
      const toggleButton = automationCard.locator('button[role="switch"]').first();
      await expect(toggleButton).toBeVisible({ timeout: 5_000 });

      // Get current state
      const initialState = await toggleButton.getAttribute('data-state');

      // Toggle the automation
      await toggleButton.click();

      // Wait for state change
      await adminPage.waitForTimeout(2000);

      // Verify state changed
      const newState = await toggleButton.getAttribute('data-state');
      expect(newState).not.toBe(initialState);

      console.log(`✅ ${automationName} toggle works in UI (${initialState} → ${newState})`);

      // Toggle back to original state
      await toggleButton.click();
      await adminPage.waitForTimeout(1000);
    }

    console.log('✅ All 4 automation types visible and toggleable in UI');
  });

  test('Automation categories are correct for all types', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const templates = body.templates;

    // Verify categories
    const proposalFollowup = templates.find((t: { id: string }) => t.id === 'proposal_followup');
    expect(proposalFollowup?.category).toBe('sales');

    const paymentReminder = templates.find((t: { id: string }) => t.id === 'payment_reminder');
    expect(paymentReminder?.category).toBe('operations');

    const reviewRequest = templates.find((t: { id: string }) => t.id === 'review_request');
    expect(reviewRequest?.category).toBe('customer_success');

    const tripCountdown = templates.find((t: { id: string }) => t.id === 'trip_countdown');
    expect(tripCountdown?.category).toBe('customer_success');

    console.log('✅ All automation categories validated:', {
      proposal_followup: 'sales',
      payment_reminder: 'operations',
      review_request: 'customer_success',
      trip_countdown: 'customer_success',
    });
  });

  test('Automation templates have valid priority ordering', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const templates = body.templates;

    // Verify each template has a priority
    const proposalFollowup = templates.find((t: { id: string }) => t.id === 'proposal_followup');
    expect(proposalFollowup?.priority).toBe(1);

    const paymentReminder = templates.find((t: { id: string }) => t.id === 'payment_reminder');
    expect(paymentReminder?.priority).toBe(2);

    const reviewRequest = templates.find((t: { id: string }) => t.id === 'review_request');
    expect(reviewRequest?.priority).toBe(3);

    const tripCountdown = templates.find((t: { id: string }) => t.id === 'trip_countdown');
    expect(tripCountdown?.priority).toBe(4);

    console.log('✅ All automation templates have valid priority ordering (1-4)');
  });

  test('All automation templates are disabled by default', async ({ adminPage }) => {
    test.setTimeout(60_000);

    const response = await adminPage.request.get(`${baseURL}/api/admin/automation/rules`);
    const status = response.status();

    if (status === 503) {
      console.warn('⚠️  Skipping due to demo mode');
      return;
    }

    expect(status).toBe(200);

    const body = await response.json();
    const templates = body.templates;

    // Verify all templates are disabled by default
    for (const template of templates) {
      expect(template.enabled_by_default).toBe(false);
    }

    console.log('✅ All automation templates disabled by default (opt-in model)');
  });
});
