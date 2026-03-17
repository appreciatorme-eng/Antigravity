#!/bin/bash
# Integration test script for auto-merge workflow
# Usage: ./test-auto-merge.sh [happy-path|ci-fail|no-review|idempotency|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Run: gh auth login"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi

    log_success "All prerequisites met"
}

# Test 1: Happy Path
test_happy_path() {
    log_info "Starting Test 1: Happy Path"
    log_info "============================"

    BRANCH_NAME="test/auto-merge-happy-path-$(date +%s)"

    # Create test branch
    log_info "Creating test branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"

    # Make a trivial change
    echo "# Auto-Merge Integration Test - Happy Path" > TEST_AUTO_MERGE_HAPPY_PATH.txt
    echo "Created at: $(date)" >> TEST_AUTO_MERGE_HAPPY_PATH.txt
    git add TEST_AUTO_MERGE_HAPPY_PATH.txt
    git commit -m "test: auto-merge happy path integration test"

    # Push branch
    log_info "Pushing branch to remote..."
    git push -u origin "$BRANCH_NAME"

    # Create PR
    log_info "Creating pull request..."
    gh pr create \
        --title "Test: Auto-Merge Happy Path ($(date +%Y-%m-%d))" \
        --body "**Integration Test for Auto-Merge Workflow**

This PR tests the happy path scenario where:
- ✅ CI checks pass
- ✅ PR has approved review
- ✅ Auto-merge workflow should merge this PR

**Test Steps:**
1. Wait for CI to pass
2. Approve this PR
3. Trigger auto-merge workflow
4. Verify PR is merged successfully

**Auto-generated test PR** - Safe to merge or close." \
        --base main \
        --head "$BRANCH_NAME"

    # Get PR number
    PR_NUMBER=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number')
    log_success "Created PR #$PR_NUMBER"

    # Wait for CI
    log_info "Waiting for CI checks to complete..."
    log_warning "This may take a few minutes. Press Ctrl+C to cancel."
    gh pr checks "$PR_NUMBER" --watch || true

    # Check CI status
    CI_STATUS=$(gh pr checks "$PR_NUMBER" --json state --jq '.[0].state')
    if [ "$CI_STATUS" != "SUCCESS" ]; then
        log_warning "CI checks have not passed yet. Status: $CI_STATUS"
        log_info "You can continue manually once CI passes."
    else
        log_success "CI checks passed"
    fi

    # Prompt for approval
    log_warning "PR #$PR_NUMBER requires approval before auto-merge can be tested"
    log_info "Option 1: Approve now (if you have permissions):"
    echo "  gh pr review $PR_NUMBER --approve --body 'LGTM - auto-merge integration test'"
    log_info "Option 2: Ask a teammate to approve PR #$PR_NUMBER"
    echo ""
    read -p "Press Enter once PR is approved to continue..."

    # Trigger workflow
    log_info "Triggering auto-merge workflow..."
    gh workflow run auto-merge-on-task-done.yml \
        -f task_id=test-happy-path \
        -f pr_number="$PR_NUMBER"

    log_success "Workflow triggered for PR #$PR_NUMBER"

    # Wait for workflow
    log_info "Waiting for workflow to start..."
    sleep 5

    # Get run ID
    RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    log_info "Workflow run ID: $RUN_ID"
    log_info "Watching workflow execution..."

    gh run watch "$RUN_ID" || true

    # Verify results
    log_info "Verifying results..."

    PR_STATE=$(gh pr view "$PR_NUMBER" --json state,merged --jq '{state: .state, merged: .merged}')
    echo "$PR_STATE"

    IS_MERGED=$(echo "$PR_STATE" | jq -r '.merged')

    if [ "$IS_MERGED" = "true" ]; then
        log_success "Test 1 PASSED: PR was successfully merged"
    else
        log_error "Test 1 FAILED: PR was not merged"
        log_info "Check workflow logs for details:"
        echo "  gh run view $RUN_ID --log"
    fi

    # Return to main branch
    git checkout main

    log_success "Test 1 complete"
    echo ""
}

# Test 2: CI Failure
test_ci_failure() {
    log_info "Starting Test 2: CI Failure"
    log_info "==========================="

    BRANCH_NAME="test/auto-merge-ci-fail-$(date +%s)"

    log_info "Creating test branch with failing CI: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"

    # Create a file that will fail linting
    echo "syntax error { { {" > projects/travel-suite/apps/web/src/test-ci-fail.ts
    git add projects/travel-suite/apps/web/src/test-ci-fail.ts
    git commit -m "test: intentional CI failure for auto-merge test"

    git push -u origin "$BRANCH_NAME"

    gh pr create \
        --title "Test: Auto-Merge CI Failure ($(date +%Y-%m-%d))" \
        --body "**Integration Test - CI Failure Path**

This PR intentionally has a syntax error to test the CI failure gate.

**Expected Behavior:**
- ❌ CI checks should fail
- ❌ Auto-merge workflow should detect failing CI
- ❌ Workflow should fail with error message

**Auto-generated test PR** - Safe to close without merging." \
        --base main \
        --head "$BRANCH_NAME"

    PR_NUMBER=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number')
    log_success "Created PR #$PR_NUMBER"

    log_info "Waiting for CI to fail..."
    sleep 10
    gh pr checks "$PR_NUMBER" || true

    log_info "Triggering auto-merge workflow (should fail)..."
    gh workflow run auto-merge-on-task-done.yml \
        -f task_id=test-ci-fail \
        -f pr_number="$PR_NUMBER"

    sleep 5
    RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')

    log_info "Watching workflow (expecting failure)..."
    gh run watch "$RUN_ID" || true

    CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq -r '.conclusion')

    if [ "$CONCLUSION" = "failure" ]; then
        log_success "Test 2 PASSED: Workflow correctly failed for CI failure"
    else
        log_error "Test 2 FAILED: Workflow did not fail as expected (conclusion: $CONCLUSION)"
    fi

    # Clean up
    log_info "Cleaning up test PR..."
    gh pr close "$PR_NUMBER" || true
    git checkout main
    git branch -D "$BRANCH_NAME" || true

    log_success "Test 2 complete"
    echo ""
}

# Test 3: No Review
test_no_review() {
    log_info "Starting Test 3: No Review Approval"
    log_info "==================================="

    BRANCH_NAME="test/auto-merge-no-review-$(date +%s)"

    log_info "Creating test branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"

    echo "# Auto-Merge Integration Test - No Review" > TEST_AUTO_MERGE_NO_REVIEW.txt
    echo "Created at: $(date)" >> TEST_AUTO_MERGE_NO_REVIEW.txt
    git add TEST_AUTO_MERGE_NO_REVIEW.txt
    git commit -m "test: no review gate test"

    git push -u origin "$BRANCH_NAME"

    gh pr create \
        --title "Test: Auto-Merge No Review ($(date +%Y-%m-%d))" \
        --body "**Integration Test - No Review Path**

This PR tests the review approval gate.

**Expected Behavior:**
- ✅ CI checks should pass
- ❌ No approved reviews
- ❌ Auto-merge workflow should fail with 'No approved reviews' error

**DO NOT APPROVE THIS PR** - It's testing the failure path.

**Auto-generated test PR** - Safe to close without merging." \
        --base main \
        --head "$BRANCH_NAME"

    PR_NUMBER=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number')
    log_success "Created PR #$PR_NUMBER"

    log_warning "DO NOT APPROVE PR #$PR_NUMBER - Testing no-review failure path"

    log_info "Waiting for CI to pass..."
    gh pr checks "$PR_NUMBER" --watch || true

    log_info "Triggering auto-merge workflow (should fail)..."
    gh workflow run auto-merge-on-task-done.yml \
        -f task_id=test-no-review \
        -f pr_number="$PR_NUMBER"

    sleep 5
    RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')

    log_info "Watching workflow (expecting failure)..."
    gh run watch "$RUN_ID" || true

    CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq -r '.conclusion')

    if [ "$CONCLUSION" = "failure" ]; then
        log_success "Test 3 PASSED: Workflow correctly failed for missing review"
    else
        log_error "Test 3 FAILED: Workflow did not fail as expected (conclusion: $CONCLUSION)"
    fi

    # Clean up
    log_info "Cleaning up test PR..."
    gh pr close "$PR_NUMBER" || true
    git checkout main
    git branch -D "$BRANCH_NAME" || true

    log_success "Test 3 complete"
    echo ""
}

# Test 4: Idempotency
test_idempotency() {
    log_info "Starting Test 4: Idempotency (Already Merged)"
    log_info "=============================================="

    BRANCH_NAME="test/auto-merge-idempotency-$(date +%s)"

    log_info "Creating test branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"

    echo "# Auto-Merge Integration Test - Idempotency" > TEST_AUTO_MERGE_IDEMPOTENCY.txt
    echo "Created at: $(date)" >> TEST_AUTO_MERGE_IDEMPOTENCY.txt
    git add TEST_AUTO_MERGE_IDEMPOTENCY.txt
    git commit -m "test: idempotency test"

    git push -u origin "$BRANCH_NAME"

    gh pr create \
        --title "Test: Auto-Merge Idempotency ($(date +%Y-%m-%d))" \
        --body "**Integration Test - Idempotency**

This PR will be manually merged first, then the auto-merge workflow will be triggered to verify it handles already-merged PRs gracefully.

**Expected Behavior:**
- ✅ Manual merge succeeds
- ✅ Auto-merge workflow re-triggered on merged PR
- ✅ Workflow succeeds with 'already merged' message
- ✅ No errors or duplicate merge attempts

**Auto-generated test PR**" \
        --base main \
        --head "$BRANCH_NAME"

    PR_NUMBER=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number')
    log_success "Created PR #$PR_NUMBER"

    log_info "Waiting for CI to pass..."
    gh pr checks "$PR_NUMBER" --watch || true

    log_info "Approving PR..."
    gh pr review "$PR_NUMBER" --approve --body "LGTM - idempotency test" || log_warning "Could not approve (may need teammate approval)"

    log_info "Manually merging PR #$PR_NUMBER..."
    gh pr merge "$PR_NUMBER" --squash --delete-branch

    log_success "PR manually merged"

    log_info "Triggering auto-merge workflow on already-merged PR (should handle gracefully)..."
    gh workflow run auto-merge-on-task-done.yml \
        -f task_id=test-idempotency \
        -f pr_number="$PR_NUMBER"

    sleep 5
    RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')

    log_info "Watching workflow (expecting success with 'already merged' message)..."
    gh run watch "$RUN_ID" || true

    CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq -r '.conclusion')

    if [ "$CONCLUSION" = "success" ]; then
        log_success "Test 4 PASSED: Workflow handled already-merged PR gracefully"
    else
        log_error "Test 4 FAILED: Workflow did not succeed (conclusion: $CONCLUSION)"
    fi

    git checkout main

    log_success "Test 4 complete"
    echo ""
}

# Main execution
main() {
    log_info "Auto-Merge Workflow Integration Tests"
    log_info "======================================"
    echo ""

    check_prerequisites
    echo ""

    TEST_SUITE="${1:-all}"

    case "$TEST_SUITE" in
        happy-path)
            test_happy_path
            ;;
        ci-fail)
            test_ci_failure
            ;;
        no-review)
            test_no_review
            ;;
        idempotency)
            test_idempotency
            ;;
        all)
            log_warning "Running all integration tests. This will create multiple PRs and may take 15-30 minutes."
            read -p "Continue? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                test_happy_path
                test_ci_failure
                test_no_review
                test_idempotency

                log_success "All integration tests complete!"
            else
                log_info "Cancelled by user"
                exit 0
            fi
            ;;
        *)
            log_error "Unknown test suite: $TEST_SUITE"
            echo ""
            echo "Usage: $0 [happy-path|ci-fail|no-review|idempotency|all]"
            echo ""
            echo "Test suites:"
            echo "  happy-path   - Test successful auto-merge (CI pass + approved review)"
            echo "  ci-fail      - Test CI failure gate"
            echo "  no-review    - Test review approval gate"
            echo "  idempotency  - Test already-merged PR handling"
            echo "  all          - Run all tests (default)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
