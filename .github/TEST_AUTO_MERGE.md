# Auto-Merge Workflow Integration Test Guide

This guide provides step-by-step instructions for testing the auto-merge workflow.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Git repository with workflow files committed
- Permission to create PRs and trigger workflows

## Test Scenarios

### Test 1: Happy Path - Manual Workflow Dispatch

This test verifies that the workflow successfully merges a PR when all safety gates pass.

#### Steps:

1. **Create a test branch with a trivial change:**
   ```bash
   git checkout -b test/auto-merge-happy-path
   echo "# Test Auto-Merge" > TEST_AUTO_MERGE.txt
   git add TEST_AUTO_MERGE.txt
   git commit -m "test: auto-merge happy path test"
   git push -u origin test/auto-merge-happy-path
   ```

2. **Create a PR:**
   ```bash
   gh pr create \
     --title "Test: Auto-Merge Happy Path" \
     --body "Integration test for auto-merge workflow. This PR should be auto-merged when CI passes and review is approved." \
     --base main \
     --head test/auto-merge-happy-path
   ```

3. **Get the PR number:**
   ```bash
   PR_NUMBER=$(gh pr list --head test/auto-merge-happy-path --json number --jq '.[0].number')
   echo "PR Number: $PR_NUMBER"
   ```

4. **Wait for CI to pass:**
   ```bash
   gh pr checks $PR_NUMBER --watch
   ```

5. **Approve the PR:**
   ```bash
   # If you have approval permissions:
   gh pr review $PR_NUMBER --approve --body "LGTM - auto-merge integration test"

   # Otherwise, ask a teammate to approve it
   ```

6. **Add test task to roadmap.json:**
   ```bash
   # Edit .github/roadmap.json to add:
   {
     "id": "test-001",
     "title": "Auto-merge integration test",
     "pr_number": <PR_NUMBER>,
     "status": "in_progress",
     "assigned_to": "test@example.com"
   }

   # Commit and push the change
   git add .github/roadmap.json
   git commit -m "test: add test-001 to roadmap"
   git push
   ```

7. **Trigger the workflow manually:**
   ```bash
   gh workflow run auto-merge-on-task-done.yml \
     -f task_id=test-001 \
     -f pr_number=$PR_NUMBER
   ```

8. **Monitor the workflow:**
   ```bash
   # Watch the workflow run
   gh run list --workflow=auto-merge-on-task-done.yml --limit 1

   # Get the run ID
   RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')

   # Watch the logs
   gh run watch $RUN_ID
   ```

9. **Verify the results:**
   ```bash
   # Check if PR was merged
   gh pr view $PR_NUMBER --json state,merged,mergedAt

   # Expected output:
   # {
   #   "merged": true,
   #   "mergedAt": "<timestamp>",
   #   "state": "MERGED"
   # }

   # Verify the workflow succeeded
   gh run view $RUN_ID --json conclusion

   # Expected output:
   # {
   #   "conclusion": "success"
   # }
   ```

#### Expected Outcomes:
- ✅ Workflow runs successfully
- ✅ Safety checks pass (CI status = success, approved review exists)
- ✅ PR is merged to main with squash method
- ✅ Merge commit message: "Auto-merge: Test: Auto-Merge Happy Path"
- ✅ No workflow errors in logs

---

### Test 2: CI Gate Failure

This test verifies that the workflow correctly fails when CI checks are not passing.

#### Steps:

1. **Create a test branch with failing CI:**
   ```bash
   git checkout -b test/auto-merge-ci-fail
   # Add a change that will fail CI (e.g., syntax error in code)
   echo "syntax error here {{{" > projects/travel-suite/apps/web/src/test-fail.ts
   git add projects/travel-suite/apps/web/src/test-fail.ts
   git commit -m "test: intentional CI failure"
   git push -u origin test/auto-merge-ci-fail
   ```

2. **Create a PR:**
   ```bash
   gh pr create \
     --title "Test: Auto-Merge CI Failure" \
     --body "Integration test - CI should fail, and auto-merge workflow should detect it." \
     --base main \
     --head test/auto-merge-ci-fail

   PR_NUMBER=$(gh pr list --head test/auto-merge-ci-fail --json number --jq '.[0].number')
   ```

3. **Wait for CI to fail:**
   ```bash
   gh pr checks $PR_NUMBER
   # Should show failing checks
   ```

4. **Trigger the workflow:**
   ```bash
   gh workflow run auto-merge-on-task-done.yml \
     -f task_id=test-002 \
     -f pr_number=$PR_NUMBER
   ```

5. **Verify workflow fails with correct error:**
   ```bash
   RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')
   gh run view $RUN_ID --log

   # Look for error message: "CI checks not passing"
   ```

6. **Clean up:**
   ```bash
   gh pr close $PR_NUMBER
   git checkout main
   git branch -D test/auto-merge-ci-fail
   ```

#### Expected Outcomes:
- ✅ Workflow runs but fails at safety check step
- ✅ Error message: "❌ Merge safety check failed: CI checks not passing: failure"
- ✅ PR is NOT merged
- ✅ Actionable error message in workflow logs

---

### Test 3: Review Approval Gate Failure

This test verifies that the workflow correctly fails when no approved reviews exist.

#### Steps:

1. **Create a test branch:**
   ```bash
   git checkout -b test/auto-merge-no-review
   echo "# Test No Review" > TEST_NO_REVIEW.txt
   git add TEST_NO_REVIEW.txt
   git commit -m "test: no review gate test"
   git push -u origin test/auto-merge-no-review
   ```

2. **Create a PR (do NOT approve it):**
   ```bash
   gh pr create \
     --title "Test: Auto-Merge No Review" \
     --body "Integration test - PR has no approved reviews." \
     --base main \
     --head test/auto-merge-no-review

   PR_NUMBER=$(gh pr list --head test/auto-merge-no-review --json number --jq '.[0].number')
   ```

3. **Wait for CI to pass but do NOT approve:**
   ```bash
   gh pr checks $PR_NUMBER --watch
   ```

4. **Trigger the workflow:**
   ```bash
   gh workflow run auto-merge-on-task-done.yml \
     -f task_id=test-003 \
     -f pr_number=$PR_NUMBER
   ```

5. **Verify workflow fails:**
   ```bash
   RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')
   gh run view $RUN_ID --log

   # Look for error: "No approved reviews found"
   ```

6. **Clean up:**
   ```bash
   gh pr close $PR_NUMBER
   git checkout main
   git branch -D test/auto-merge-no-review
   ```

#### Expected Outcomes:
- ✅ Workflow fails at safety check step
- ✅ Error message: "❌ Merge safety check failed: No approved reviews found"
- ✅ PR is NOT merged

---

### Test 4: Idempotency (Already Merged PR)

This test verifies that the workflow handles re-triggers on already-merged PRs gracefully.

#### Steps:

1. **Create and manually merge a test PR:**
   ```bash
   git checkout -b test/auto-merge-already-merged
   echo "# Test Already Merged" > TEST_ALREADY_MERGED.txt
   git add TEST_ALREADY_MERGED.txt
   git commit -m "test: idempotency test"
   git push -u origin test/auto-merge-already-merged

   gh pr create \
     --title "Test: Auto-Merge Already Merged" \
     --body "Integration test - PR will be manually merged first." \
     --base main \
     --head test/auto-merge-already-merged

   PR_NUMBER=$(gh pr list --head test/auto-merge-already-merged --json number --jq '.[0].number')
   ```

2. **Approve and manually merge:**
   ```bash
   gh pr review $PR_NUMBER --approve --body "LGTM"
   gh pr merge $PR_NUMBER --squash --delete-branch
   ```

3. **Trigger the workflow on the already-merged PR:**
   ```bash
   gh workflow run auto-merge-on-task-done.yml \
     -f task_id=test-004 \
     -f pr_number=$PR_NUMBER
   ```

4. **Verify graceful handling:**
   ```bash
   RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')
   gh run view $RUN_ID --log

   # Look for: "PR is already merged - skipping merge execution"
   ```

#### Expected Outcomes:
- ✅ Workflow succeeds (not fails)
- ✅ Message: "✅ PR is already merged - skipping merge execution"
- ✅ No error or duplicate merge attempt
- ✅ Idempotency verified

---

## Automated Test Script

You can also use this automated test script to run all tests:

```bash
#!/bin/bash
# File: .github/scripts/run-integration-tests.sh

set -e

echo "🧪 Running Auto-Merge Integration Tests"
echo "========================================"

# Test 1: Happy Path
echo ""
echo "Test 1: Happy Path (Manual approval required)"
echo "----------------------------------------------"
git checkout -b test/auto-merge-happy-path-$(date +%s)
echo "# Test" > TEST.txt
git add TEST.txt
git commit -m "test: auto-merge happy path"
git push -u origin HEAD
gh pr create --title "Test: Auto-Merge Happy Path" --body "Auto-merge test" --base main --head HEAD
PR_NUM=$(gh pr list --head HEAD --json number --jq '.[0].number')
echo "✅ Created PR #$PR_NUM"
echo "⏳ Waiting for CI..."
gh pr checks $PR_NUM --watch
echo "👤 Please approve PR #$PR_NUM manually, then press Enter"
read
gh workflow run auto-merge-on-task-done.yml -f task_id=test-001 -f pr_number=$PR_NUM
echo "⏳ Waiting for workflow..."
sleep 10
RUN_ID=$(gh run list --workflow=auto-merge-on-task-done.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RUN_ID
gh pr view $PR_NUM --json merged

echo ""
echo "✅ All integration tests complete!"
```

## Verification Checklist

After running all tests, verify:

- [ ] Test 1 (Happy Path): PR merged successfully
- [ ] Test 2 (CI Failure): Workflow failed with correct error message
- [ ] Test 3 (No Review): Workflow failed with correct error message
- [ ] Test 4 (Idempotency): Workflow succeeded without duplicate merge
- [ ] All workflow logs are clear and actionable
- [ ] No security warnings or permission issues
- [ ] Roadmap.json updates work correctly
- [ ] Manual and repository_dispatch triggers both work

## Troubleshooting

### Workflow not appearing in Actions tab
```bash
# Verify workflow file is valid YAML
yamllint .github/workflows/auto-merge-on-task-done.yml

# Check for syntax errors
gh workflow list | grep auto-merge
```

### Script errors
```bash
# Test scripts locally
node .github/scripts/check-merge-safety.js --help
node .github/scripts/execute-merge.js --help
```

### Permission denied errors
```bash
# Verify GitHub token has correct permissions
gh auth status

# Check workflow permissions in .github/workflows/auto-merge-on-task-done.yml
grep -A 5 "permissions:" .github/workflows/auto-merge-on-task-done.yml
```

## Notes

- The workflow uses `GITHUB_TOKEN` which has read/write permissions
- Merged PRs via this workflow will NOT trigger other workflows (this is a GitHub limitation)
- If you need downstream workflows to trigger, use a Personal Access Token (PAT) instead
- Always test in a non-production branch first
