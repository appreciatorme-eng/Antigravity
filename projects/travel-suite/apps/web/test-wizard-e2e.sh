#!/bin/bash

# End-to-End Onboarding Wizard Test Script
# Task: subtask-8-1 - End-to-end wizard flow verification

set -e

SERVER_URL="http://localhost:3200"
RESULTS_FILE="./e2e-test-results.txt"

echo "Starting E2E Wizard Tests..." > "$RESULTS_FILE"
echo "Server URL: $SERVER_URL" >> "$RESULTS_FILE"
echo "Test Date: $(date)" >> "$RESULTS_FILE"
echo "================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Test 1: Server is running
echo "Test 1: Verify server is running..."
if curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200"; then
    echo "✅ Test 1 PASSED: Server is running on $SERVER_URL" | tee -a "$RESULTS_FILE"
else
    echo "❌ Test 1 FAILED: Server is not responding" | tee -a "$RESULTS_FILE"
    exit 1
fi
echo "" >> "$RESULTS_FILE"

# Test 2: Onboarding page is accessible
echo "Test 2: Verify /onboarding page is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/onboarding")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ Test 2 PASSED: /onboarding page is accessible (HTTP $HTTP_CODE)" | tee -a "$RESULTS_FILE"
else
    echo "❌ Test 2 FAILED: /onboarding page returned HTTP $HTTP_CODE" | tee -a "$RESULTS_FILE"
fi
echo "" >> "$RESULTS_FILE"

# Test 3: Settings page is accessible
echo "Test 3: Verify /settings page is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/settings")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ Test 3 PASSED: /settings page is accessible (HTTP $HTTP_CODE)" | tee -a "$RESULTS_FILE"
else
    echo "❌ Test 3 FAILED: /settings page returned HTTP $HTTP_CODE" | tee -a "$RESULTS_FILE"
fi
echo "" >> "$RESULTS_FILE"

# Test 4: Check for console errors in page load
echo "Test 4: Check TypeScript compilation..."
cd "$(dirname "$0")/projects/travel-suite/apps/web" || exit 1
if npm run typecheck 2>&1 | grep -q "Found 0 errors"; then
    echo "✅ Test 4 PASSED: No TypeScript errors" | tee -a "$RESULTS_FILE"
else
    echo "⚠️  Test 4 WARNING: TypeScript errors detected" | tee -a "$RESULTS_FILE"
fi
cd - > /dev/null || exit 1
echo "" >> "$RESULTS_FILE"

# Test 5: Verify wizard components exist
echo "Test 5: Verify wizard components exist..."
COMPONENTS=(
    "TripCreationStep.tsx"
    "ProposalGenerationStep.tsx"
    "WhatsAppSetupStep.tsx"
    "PaymentSetupStep.tsx"
    "SampleDataLoader.tsx"
    "StepTooltip.tsx"
    "VideoHelpButton.tsx"
)

ALL_EXIST=true
for component in "${COMPONENTS[@]}"; do
    if [ -f "./projects/travel-suite/apps/web/src/app/onboarding/_components/$component" ]; then
        echo "  ✓ $component exists"
    else
        echo "  ✗ $component NOT FOUND"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = true ]; then
    echo "✅ Test 5 PASSED: All wizard components exist" | tee -a "$RESULTS_FILE"
else
    echo "❌ Test 5 FAILED: Some wizard components are missing" | tee -a "$RESULTS_FILE"
fi
echo "" >> "$RESULTS_FILE"

# Test 6: Verify analytics integration exists
echo "Test 6: Verify analytics integration..."
if [ -f "./projects/travel-suite/apps/web/src/lib/analytics/onboarding-events.ts" ]; then
    echo "✅ Test 6 PASSED: Onboarding analytics module exists" | tee -a "$RESULTS_FILE"
else
    echo "❌ Test 6 FAILED: Onboarding analytics module not found" | tee -a "$RESULTS_FILE"
fi
echo "" >> "$RESULTS_FILE"

# Test 7: Verify store has skip tracking
echo "Test 7: Verify onboarding store has skip tracking..."
if grep -q "skippedSteps" "./projects/travel-suite/apps/web/src/stores/onboarding-store.ts"; then
    echo "✅ Test 7 PASSED: Skip tracking exists in store" | tee -a "$RESULTS_FILE"
else
    echo "❌ Test 7 FAILED: Skip tracking not found in store" | tee -a "$RESULTS_FILE"
fi
echo "" >> "$RESULTS_FILE"

# Test 8: Check for lint errors
echo "Test 8: Check for lint errors..."
cd "$(dirname "$0")/projects/travel-suite/apps/web" || exit 1
if npm run lint 2>&1 | grep -q "0 errors"; then
    echo "✅ Test 8 PASSED: No lint errors" | tee -a "$RESULTS_FILE"
else
    echo "⚠️  Test 8 WARNING: Lint errors detected" | tee -a "$RESULTS_FILE"
fi
cd - > /dev/null || exit 1
echo "" >> "$RESULTS_FILE"

echo "================================" >> "$RESULTS_FILE"
echo "Automated tests completed!" | tee -a "$RESULTS_FILE"
echo "Results saved to: $RESULTS_FILE" | tee -a "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "MANUAL TESTING REQUIRED:" >> "$RESULTS_FILE"
echo "1. Complete user sign up flow" >> "$RESULTS_FILE"
echo "2. Test sample data loading" >> "$RESULTS_FILE"
echo "3. Test trip creation in wizard" >> "$RESULTS_FILE"
echo "4. Test AI proposal generation" >> "$RESULTS_FILE"
echo "5. Test WhatsApp setup skip" >> "$RESULTS_FILE"
echo "6. Test payment setup skip" >> "$RESULTS_FILE"
echo "7. Verify PostHog events in dashboard" >> "$RESULTS_FILE"
echo "8. Test wizard dismissal and resume" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "Please complete the checklist in e2e-wizard-test-checklist.md" >> "$RESULTS_FILE"

cat "$RESULTS_FILE"
