# Integration Test Instructions for Auto-Merge Workflow

## Quick Start

The auto-merge workflow integration tests verify that the workflow correctly:
1. Merges PRs when all safety gates pass (happy path)
2. Blocks merges when CI checks fail
3. Blocks merges when review approvals are missing
4. Handles already-merged PRs gracefully (idempotency)

## Prerequisites

Before running integration tests, ensure:

```bash
# 1. Push the auto-merge feature branch to GitHub
git push -u origin auto-claude/027-auto-merge-prs-when-task-moved-to-done

# 2. Verify GitHub CLI is authenticated
gh auth status

# 3. Verify required commands are installed
command -v gh && command -v jq && echo "✅ Prerequisites met"
```

## Running Tests

### Option 1: Automated Test Script (Recommended)

Run all tests automatically:

```bash
# From repository root
./.github/scripts/test-auto-merge.sh all
```

Run individual tests:

```bash
# Test 1: Happy path (successful merge)
./.github/scripts/test-auto-merge.sh happy-path

# Test 2: CI failure gate
./.github/scripts/test-auto-merge.sh ci-fail

# Test 3: Review approval gate
./.github/scripts/test-auto-merge.sh no-review

# Test 4: Idempotency (already merged)
./.github/scripts/test-auto-merge.sh idempotency
```

### Option 2: Manual Testing

Follow the detailed step-by-step guide in `.github/TEST_AUTO_MERGE.md`.

## Expected Timeline

- **Test 1 (Happy Path)**: ~10-15 minutes (includes CI wait time)
- **Test 2 (CI Failure)**: ~5-10 minutes
- **Test 3 (No Review)**: ~5-10 minutes
- **Test 4 (Idempotency)**: ~5-10 minutes
- **All Tests**: ~25-45 minutes total

## Verification Checklist

After running all tests, verify:

- [ ] **Test 1**: PR merged successfully with squash commit
  - [ ] Workflow status: ✅ Success
  - [ ] PR state: Merged
  - [ ] Merge commit message includes "Auto-merge:"
  - [ ] No errors in workflow logs

- [ ] **Test 2**: Workflow failed with CI error
  - [ ] Workflow status: ❌ Failed
  - [ ] Error message: "CI checks not passing"
  - [ ] PR state: Open (not merged)
  - [ ] Clear, actionable error in logs

- [ ] **Test 3**: Workflow failed with review error
  - [ ] Workflow status: ❌ Failed
  - [ ] Error message: "No approved reviews found"
  - [ ] PR state: Open (not merged)
  - [ ] Clear, actionable error in logs

- [ ] **Test 4**: Workflow succeeded with skip message
  - [ ] Workflow status: ✅ Success
  - [ ] Log message: "PR is already merged - skipping"
  - [ ] No duplicate merge attempt
  - [ ] Idempotency verified

## Troubleshooting

### Issue: GitHub CLI authentication fails

```bash
# Re-authenticate with necessary scopes
gh auth login --scopes repo,workflow

# Verify authentication
gh auth status
```

### Issue: Workflow doesn't appear in Actions tab

```bash
# Verify workflow file exists and is valid
test -f .github/workflows/auto-merge-on-task-done.yml && echo "File exists"

# Check YAML syntax
yamllint .github/workflows/auto-merge-on-task-done.yml

# List workflows
gh workflow list | grep auto-merge
```

### Issue: Script errors

```bash
# Test scripts can run
node .github/scripts/check-merge-safety.js --help
node .github/scripts/execute-merge.js --help

# Verify scripts are committed
git status .github/scripts/
```

### Issue: CI takes too long

```bash
# Check CI status without waiting
gh pr checks <PR_NUMBER>

# View CI logs
gh pr checks <PR_NUMBER> --watch
```

### Issue: Cannot approve PR (permissions)

If you don't have approval permissions:
1. Ask a teammate to approve the test PR
2. Or: Add yourself as a collaborator with write access
3. Or: Use a different GitHub account with admin access

## Post-Test Cleanup

After successful tests:

```bash
# View all test branches
git branch -r | grep test/auto-merge

# Delete test branches (if not auto-deleted)
git push origin --delete test/auto-merge-happy-path-*
git push origin --delete test/auto-merge-ci-fail-*
# etc.

# Clean up local branches
git checkout main
git branch | grep test/auto-merge | xargs git branch -D
```

## Integration with CI/CD

Once tests pass, the auto-merge workflow can be integrated into your CI/CD pipeline:

```yaml
# In your main CI workflow (.github/workflows/ci.yml)
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]

jobs:
  # ... existing CI jobs ...

  # Add this job to auto-trigger merge when PR is labeled "ready-to-merge"
  auto-merge-on-label:
    name: Auto-Merge Ready PRs
    if: contains(github.event.pull_request.labels.*.name, 'ready-to-merge')
    needs: [lint, test, build]  # Wait for CI to pass
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto-Merge
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          event-type: task_done
          client-payload: |
            {
              "task_id": "auto-label-${{ github.event.pull_request.number }}",
              "pr_number": ${{ github.event.pull_request.number }}
            }
```

## Security Considerations

- The test script creates real PRs that can be merged
- Always review test PR content before approving
- Test in a development environment first
- Ensure `GITHUB_TOKEN` has only necessary permissions
- Review workflow logs for sensitive data before sharing

## Success Criteria

Integration tests are considered successful when:

1. ✅ All 4 test scenarios complete without unexpected errors
2. ✅ Happy path test merges PR correctly
3. ✅ Failure path tests correctly block merges
4. ✅ Idempotency test handles re-triggers gracefully
5. ✅ Error messages are clear and actionable
6. ✅ No security warnings or permission issues
7. ✅ Workflow logs are clean and informative
8. ✅ Manual and automated triggers both work

## Next Steps

After successful integration tests:

1. Create PR for the auto-merge feature implementation
2. Get team review and approval
3. Merge to main branch
4. Update production roadmap.json with real task mappings
5. Configure production triggers (repository_dispatch or scheduled)
6. Monitor first few production auto-merges closely
7. Set up alerts for workflow failures

## Support

For issues or questions:
- Review: `.github/TEST_AUTO_MERGE.md` (detailed test guide)
- Review: `docs/AUTO_MERGE.md` (workflow documentation)
- Check workflow logs: `gh run view <RUN_ID> --log`
- View PR status: `gh pr view <PR_NUMBER>`
