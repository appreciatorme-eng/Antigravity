#!/usr/bin/env node

/**
 * Execute Merge - Merge Execution with Idempotency
 *
 * Executes a pull request merge with the following safety measures:
 * 1. Polls mergeable field (may be null initially, requires up to 5 retries)
 * 2. Checks if PR is already merged (idempotency)
 * 3. Executes squash merge with auto-generated commit message
 * 4. Handles merge conflicts and protected branch rules
 *
 * Usage in GitHub Actions (with actions/github-script@v8):
 *   const executeMerge = require('./.github/scripts/execute-merge.js');
 *   await executeMerge({ github, context, core, prNumber });
 *
 * Standalone usage:
 *   node .github/scripts/execute-merge.js --help
 */

/**
 * Main merge execution function
 * @param {Object} params
 * @param {Object} params.github - Octokit instance from actions/github-script
 * @param {Object} params.context - GitHub Actions context
 * @param {Object} params.core - GitHub Actions core toolkit
 * @param {number} params.prNumber - Pull request number to merge
 * @returns {Promise<Object>} Merge result { success: boolean, reason?: string }
 */
async function executeMerge({ github, context, core, prNumber }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  try {
    // ─── Step 1: Fetch PR details ───
    core.info(`🔍 Fetching PR #${prNumber} details...`);
    let { data: pr } = await github.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });

    // ─── Step 2: Check if PR is already merged (idempotency) ───
    if (pr.state === 'closed') {
      if (pr.merged) {
        core.info(`✅ PR #${prNumber} is already merged, skipping merge execution`);
        return { success: true, alreadyMerged: true };
      } else {
        core.setFailed(`❌ PR #${prNumber} is closed but not merged`);
        return { success: false, reason: 'PR is closed without merging' };
      }
    }

    // ─── Step 3: Poll for mergeable state (may be null initially) ───
    core.info(`🔍 Checking mergeable state for PR #${prNumber}...`);
    let pollAttempts = 0;
    const maxPolls = 5;
    const pollDelay = 1000; // 1 second

    while (pr.mergeable === null && pollAttempts < maxPolls) {
      pollAttempts++;
      core.info(`⏳ Mergeable state is null, polling (attempt ${pollAttempts}/${maxPolls})...`);
      await new Promise(resolve => setTimeout(resolve, pollDelay));

      const response = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });
      pr = response.data;
    }

    // Check if mergeable state is still null after polling
    if (pr.mergeable === null) {
      core.setFailed(
        `❌ Unable to determine mergeable state for PR #${prNumber} after ${maxPolls} attempts. ` +
        `GitHub API may be delayed. Try again in a few moments.`
      );
      return { success: false, reason: 'Mergeable state unknown' };
    }

    // Check if PR is mergeable
    if (!pr.mergeable) {
      core.setFailed(
        `❌ PR #${prNumber} is not mergeable. Possible reasons:\n` +
        `  - Merge conflicts exist (resolve conflicts manually)\n` +
        `  - Protected branch rules not satisfied\n` +
        `  - Base branch has been updated (rebase may be needed)`
      );
      return { success: false, reason: 'PR is not mergeable' };
    }

    core.info(`✅ PR #${prNumber} is mergeable`);

    // ─── Step 4: Execute squash merge ───
    core.info(`🚀 Executing squash merge for PR #${prNumber}...`);

    const commitTitle = `Auto-merge: ${pr.title}`;
    const commitMessage = `Merged via auto-merge workflow (task completed)\n\nPR: #${prNumber}`;

    await github.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: 'squash',
      commit_title: commitTitle,
      commit_message: commitMessage
    });

    core.info(`✅ PR #${prNumber} merged successfully to ${pr.base.ref}`);
    return { success: true };

  } catch (error) {
    // Handle specific error codes
    if (error.status === 404) {
      core.setFailed(`❌ PR #${prNumber} not found (invalid PR number or no access)`);
      return { success: false, reason: 'PR not found' };
    }

    if (error.status === 405) {
      core.setFailed(
        `❌ PR #${prNumber} cannot be merged (HTTP 405). Possible reasons:\n` +
        `  - PR is not in a mergeable state\n` +
        `  - Protected branch rules are not satisfied\n` +
        `  - Required status checks have not passed\n` +
        `  - Required reviews are missing\n` +
        `Details: ${error.message}`
      );
      return { success: false, reason: 'Merge not allowed (405)' };
    }

    if (error.status === 409) {
      core.setFailed(
        `❌ Merge conflict detected (HTTP 409). The PR head SHA has changed.\n` +
        `Someone may have pushed new commits while the merge was in progress.\n` +
        `Details: ${error.message}`
      );
      return { success: false, reason: 'Merge conflict (409 - SHA mismatch)' };
    }

    // Generic error handling
    core.setFailed(`❌ Unexpected error during merge execution: ${error.message}`);
    throw error;
  }
}

// ─── CLI Interface ───
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Execute Merge - Merge Execution with Idempotency

DESCRIPTION:
  Executes a pull request merge with the following safety measures:
  1. Polls mergeable field (may be null initially, retries up to 5 times)
  2. Checks if PR is already merged (idempotency - exits gracefully)
  3. Executes squash merge with auto-generated commit message
  4. Handles merge conflicts and protected branch rule violations

USAGE:
  In GitHub Actions with actions/github-script@v8:
    const executeMerge = require('./.github/scripts/execute-merge.js');
    const result = await executeMerge({ github, context, core, prNumber });
    if (!result.success) {
      core.setFailed(\`Merge execution failed: \${result.reason}\`);
    }

  Standalone (help only):
    node .github/scripts/execute-merge.js --help

PARAMETERS:
  github   - Octokit instance (from actions/github-script)
  context  - GitHub Actions context (owner, repo)
  core     - GitHub Actions core toolkit (for logging)
  prNumber - Pull request number to merge (number)

RETURN VALUE:
  { success: true }                           - Merge completed successfully
  { success: true, alreadyMerged: true }     - PR already merged (idempotent)
  { success: false, reason: string }         - Merge failed with reason

MERGE METHOD:
  Uses 'squash' merge method for clean commit history.
  Commit title format: "Auto-merge: <PR title>"
  Commit message format: "Merged via auto-merge workflow (task completed)\\n\\nPR: #<number>"

ERROR HANDLING:
  404 - PR not found (invalid PR number or access denied)
  405 - Merge not allowed (protected branch rules, missing checks/reviews)
  409 - Merge conflict (PR head SHA changed during merge)

EXIT CODES:
  0 - Help displayed successfully
  1 - Error (when run with invalid arguments)

EXAMPLES:
  # Display this help
  node .github/scripts/execute-merge.js --help

  # Use in GitHub Actions workflow
  - name: Execute merge
    uses: actions/github-script@v8
    with:
      script: |
        const executeMerge = require('./.github/scripts/execute-merge.js');
        const result = await executeMerge({
          github,
          context,
          core,
          prNumber: 123  // Use your PR number here or from workflow inputs
        });
        if (!result.success) {
          throw new Error('Merge execution failed: ' + result.reason);
        }
`);
    process.exit(0);
  }

  console.error('Error: This script is designed to run within GitHub Actions.');
  console.error('Run with --help for usage information.');
  process.exit(1);
}

// Export for use in GitHub Actions
module.exports = executeMerge;
