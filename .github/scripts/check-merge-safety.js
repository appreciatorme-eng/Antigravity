#!/usr/bin/env node

/**
 * Check Merge Safety - CI Status and Review Validation
 *
 * Validates that a pull request is safe to merge by checking:
 * 1. Combined CI status is 'success'
 * 2. At least one approved review exists
 * 3. No CHANGES_REQUESTED reviews blocking the merge
 *
 * Usage in GitHub Actions (with actions/github-script@v8):
 *   const checkMergeSafety = require('./.github/scripts/check-merge-safety.js');
 *   await checkMergeSafety({ github, context, core, prNumber });
 *
 * Standalone usage:
 *   node .github/scripts/check-merge-safety.js --help
 */

/**
 * Main validation function
 * @param {Object} params
 * @param {Object} params.github - Octokit instance from actions/github-script
 * @param {Object} params.context - GitHub Actions context
 * @param {Object} params.core - GitHub Actions core toolkit
 * @param {number} params.prNumber - Pull request number to validate
 * @returns {Promise<Object>} Validation result { safe: boolean, reason?: string }
 */
async function checkMergeSafety({ github, context, core, prNumber }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  try {
    // ─── Step 1: Fetch PR details ───
    core.info(`🔍 Fetching PR #${prNumber} details...`);
    const { data: pr } = await github.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });

    // ─── Step 2: Check if PR is already merged or closed ───
    if (pr.state === 'closed') {
      if (pr.merged) {
        core.info(`✅ PR #${prNumber} is already merged, skipping safety checks`);
        return { safe: true, alreadyMerged: true };
      } else {
        core.setFailed(`❌ PR #${prNumber} is closed but not merged`);
        return { safe: false, reason: 'PR is closed without merging' };
      }
    }

    // ─── Step 3: Validate CI status ───
    core.info(`🔍 Checking CI status for PR #${prNumber}...`);
    const ref = pr.head.sha;

    // Check combined status (legacy status checks)
    const { data: combinedStatus } = await github.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref
    });

    // Check check-runs (GitHub Checks API)
    const { data: checkRuns } = await github.rest.checks.listForRef({
      owner,
      repo,
      ref
    });

    // Combined status states: error > failure > pending > success
    const hasFailedStatus = combinedStatus.state !== 'success' && combinedStatus.state !== 'pending';
    const hasFailedChecks = checkRuns.check_runs.some(
      run => run.conclusion === 'failure' || run.conclusion === 'cancelled'
    );
    const hasPendingChecks = checkRuns.check_runs.some(
      run => run.status !== 'completed' || run.conclusion === null
    );

    if (hasFailedStatus) {
      core.setFailed(
        `❌ CI checks failed: Combined status is '${combinedStatus.state}'\n` +
        `Failed statuses: ${combinedStatus.statuses
          .filter(s => s.state === 'failure' || s.state === 'error')
          .map(s => `${s.context}: ${s.state}`)
          .join(', ')}`
      );
      return { safe: false, reason: `CI status: ${combinedStatus.state}` };
    }

    if (hasFailedChecks) {
      const failedChecks = checkRuns.check_runs
        .filter(run => run.conclusion === 'failure' || run.conclusion === 'cancelled')
        .map(run => `${run.name}: ${run.conclusion}`)
        .join(', ');
      core.setFailed(`❌ CI checks failed: ${failedChecks}`);
      return { safe: false, reason: 'CI checks failed' };
    }

    if (hasPendingChecks) {
      const pendingChecks = checkRuns.check_runs
        .filter(run => run.status !== 'completed')
        .map(run => run.name)
        .join(', ');
      core.setFailed(`❌ CI checks still pending: ${pendingChecks}`);
      return { safe: false, reason: 'CI checks pending' };
    }

    // If no check runs and combined status is pending, checks are still running
    if (combinedStatus.state === 'pending' && checkRuns.check_runs.length === 0) {
      core.setFailed(`❌ CI checks are still pending (no completed checks yet)`);
      return { safe: false, reason: 'CI checks pending' };
    }

    core.info(`✅ CI checks passed: Combined status '${combinedStatus.state}', ${checkRuns.check_runs.length} check runs completed`);

    // ─── Step 4: Validate review approvals ───
    core.info(`🔍 Checking review approvals for PR #${prNumber}...`);
    const { data: reviews } = await github.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber
    });

    // Get latest review state per reviewer (reviews are chronologically ordered)
    const latestReviewsByUser = {};
    for (const review of reviews) {
      if (review.user && review.user.login) {
        latestReviewsByUser[review.user.login] = review.state;
      }
    }

    const latestReviews = Object.values(latestReviewsByUser);
    const approvedReviews = latestReviews.filter(state => state === 'APPROVED');
    const changesRequestedReviews = latestReviews.filter(state => state === 'CHANGES_REQUESTED');

    // Check for blocking CHANGES_REQUESTED reviews
    if (changesRequestedReviews.length > 0) {
      core.setFailed(
        `❌ ${changesRequestedReviews.length} reviewer(s) requested changes. ` +
        `Address feedback before merging.`
      );
      return { safe: false, reason: 'Changes requested by reviewers' };
    }

    // Check for at least one approval
    if (approvedReviews.length === 0) {
      core.setFailed(
        `❌ No approved reviews found. At least one approval is required before merging.`
      );
      return { safe: false, reason: 'No approved reviews' };
    }

    core.info(`✅ Review requirements met: ${approvedReviews.length} approval(s), no changes requested`);

    // ─── Step 5: All checks passed ───
    core.info(`✅ All safety checks passed for PR #${prNumber}`);
    return { safe: true };

  } catch (error) {
    if (error.status === 404) {
      core.setFailed(`❌ PR #${prNumber} not found (invalid PR number or no access)`);
      return { safe: false, reason: 'PR not found' };
    }
    core.setFailed(`❌ Unexpected error during safety checks: ${error.message}`);
    throw error;
  }
}

// ─── CLI Interface ───
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Check Merge Safety - CI Status and Review Validation

DESCRIPTION:
  Validates that a pull request is safe to merge by checking:
  1. Combined CI status is 'success' (all status checks and check-runs passed)
  2. At least one approved review exists
  3. No CHANGES_REQUESTED reviews blocking the merge
  4. PR is not already closed/merged

USAGE:
  In GitHub Actions with actions/github-script@v8:
    const checkMergeSafety = require('./.github/scripts/check-merge-safety.js');
    const result = await checkMergeSafety({ github, context, core, prNumber });
    if (!result.safe) {
      core.setFailed(\`Merge safety check failed: \${result.reason}\`);
    }

  Standalone (help only):
    node .github/scripts/check-merge-safety.js --help

PARAMETERS:
  github   - Octokit instance (from actions/github-script)
  context  - GitHub Actions context (owner, repo)
  core     - GitHub Actions core toolkit (for logging)
  prNumber - Pull request number to validate (number)

RETURN VALUE:
  { safe: true }                              - All checks passed
  { safe: true, alreadyMerged: true }        - PR already merged (idempotent)
  { safe: false, reason: string }            - Check failed with reason

EXIT CODES:
  0 - Help displayed successfully
  1 - Error (when run with invalid arguments)

EXAMPLES:
  # Display this help
  node .github/scripts/check-merge-safety.js --help

  # Use in GitHub Actions workflow
  - name: Check merge safety
    uses: actions/github-script@v8
    with:
      script: |
        const checkMergeSafety = require('./.github/scripts/check-merge-safety.js');
        const result = await checkMergeSafety({
          github,
          context,
          core,
          prNumber: 123  // Use your PR number here or from workflow inputs
        });
        if (!result.safe) {
          throw new Error('Safety check failed: ' + result.reason);
        }
`);
    process.exit(0);
  }

  console.error('Error: This script is designed to run within GitHub Actions.');
  console.error('Run with --help for usage information.');
  process.exit(1);
}

// Export for use in GitHub Actions
module.exports = checkMergeSafety;
