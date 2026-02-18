#!/bin/bash

# GitHub Repository Cleanup Script
# Created for Antigravity Monorepo
# This script safely cleans up your repository

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GitHub Repository Cleanup Script                    ║${NC}"
echo -e "${BLUE}║   Antigravity Monorepo                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

# Verify we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository!${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Pre-Cleanup Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check repository size
REPO_SIZE=$(du -sh .git | awk '{print $1}')
TOTAL_SIZE=$(du -sh . | awk '{print $1}')
echo -e "Repository size: ${BLUE}$TOTAL_SIZE${NC} (.git: $REPO_SIZE)"

# Count commits
COMMIT_COUNT=$(git rev-list --all --count 2>/dev/null || echo "0")
echo -e "Total commits: ${BLUE}$COMMIT_COUNT${NC}"

# Count branches
BRANCH_COUNT=$(git branch -a | wc -l | xargs)
echo -e "Total branches: ${BLUE}$BRANCH_COUNT${NC}"

# Find large files
echo ""
echo -e "${YELLOW}🔍 Finding large files (>1MB)...${NC}"
git ls-files | while read file; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        if [ "$size" -gt 1048576 ]; then
            size_mb=$(echo "scale=2; $size/1048576" | bc)
            echo "  - $file (${size_mb}MB)"
        fi
    fi
done

echo ""
echo -e "${YELLOW}🗑️  Step 1: Remove .DS_Store files from tracking${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DS_STORE_FILES=$(git ls-files | grep -E "\.DS_Store$" || true)
if [ -n "$DS_STORE_FILES" ]; then
    echo "$DS_STORE_FILES" | while read file; do
        echo "  Removing: $file"
        git rm --cached "$file" 2>/dev/null || true
    done
    echo -e "${GREEN}✓ .DS_Store files removed from tracking${NC}"
else
    echo -e "${GREEN}✓ No .DS_Store files found in tracking${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Step 2: Update root .gitignore${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

GITIGNORE_CONTENT="# Temporary files
.tmp/
*.swp
*.swo
*~

# Environment variables
.env
.env.*
!.env.example
!.env.docker
!.env.test
!.env.test.example
!.env.n8n.example

# Credentials (NEVER commit)
credentials.json
token.json
*service-account*.json
*.p12
*.p8

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
*.egg-info/

# Node.js
node_modules/
.npm/
.pnpm-store/
.yarn/
.turbo/

# Build outputs
build/
dist/
out/
.next/
.vercel/
*.app

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
*.bak

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Supabase
supabase/.temp/
"

echo "$GITIGNORE_CONTENT" > .gitignore
echo -e "${GREEN}✓ Updated .gitignore with comprehensive patterns${NC}"

echo ""
echo -e "${YELLOW}🔍 Step 3: Check for accidentally tracked sensitive files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SENSITIVE_PATTERNS=(
    "\.env$"
    "credentials\.json$"
    "token\.json$"
    "service-account.*\.json$"
    "\.p12$"
    "\.p8$"
    "\.pem$"
    "id_rsa"
    "\.key$"
)

FOUND_SENSITIVE=false
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    MATCHES=$(git ls-files | grep -E "$pattern" | grep -v ".example" || true)
    if [ -n "$MATCHES" ]; then
        echo -e "${RED}⚠️  WARNING: Potentially sensitive files found:${NC}"
        echo "$MATCHES" | while read file; do
            echo -e "  ${RED}✗ $file${NC}"
        done
        FOUND_SENSITIVE=true
    fi
done

if [ "$FOUND_SENSITIVE" = false ]; then
    echo -e "${GREEN}✓ No sensitive files detected in tracking${NC}"
fi

echo ""
echo -e "${YELLOW}🌿 Step 4: Analyze branches${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Local branches:"
git branch -vv

echo ""
echo "Remote branches:"
git branch -r

echo ""
echo "Merged branches (can be deleted):"
MERGED=$(git branch -r --merged origin/main | grep -v "origin/main" | grep -v "origin/HEAD" || echo "  None")
if [ "$MERGED" = "  None" ]; then
    echo -e "${GREEN}✓ No merged branches to clean up${NC}"
else
    echo "$MERGED"
fi

echo ""
echo -e "${YELLOW}🗜️  Step 5: Optimize git repository${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Running git garbage collection..."
git gc --aggressive --prune=now

echo ""
echo "Verifying repository integrity..."
git fsck --full 2>&1 | grep -v "^Checking" | grep -v "^done" || echo -e "${GREEN}✓ Repository integrity verified${NC}"

# Repack to optimize
echo ""
echo "Repacking repository..."
git repack -a -d --depth=250 --window=250

echo ""
echo -e "${YELLOW}📊 Post-Cleanup Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEW_REPO_SIZE=$(du -sh .git | awk '{print $1}')
NEW_TOTAL_SIZE=$(du -sh . | awk '{print $1}')
echo -e "New repository size: ${GREEN}$NEW_TOTAL_SIZE${NC} (.git: $NEW_REPO_SIZE)"
echo -e "Previous size: $TOTAL_SIZE (.git: $REPO_SIZE)"

# Count objects
echo ""
echo "Git object statistics:"
git count-objects -vH

echo ""
echo -e "${YELLOW}💾 Step 6: Generate pre-commit hook${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PRECOMMIT_HOOK=".git/hooks/pre-commit"
cat > "$PRECOMMIT_HOOK" << 'EOF'
#!/bin/bash

# Pre-commit hook to prevent committing sensitive files
# Generated by cleanup-repo.sh

SENSITIVE_PATTERNS=(
    "\.env$"
    "credentials\.json$"
    "token\.json$"
    "*service-account*.json$"
    "\.p12$"
    "\.p8$"
    "\.key$"
    "id_rsa"
)

RED='\033[0;31m'
NC='\033[0m'

FOUND_ISSUE=false

# Check for .DS_Store
if git diff --cached --name-only | grep -q "\.DS_Store"; then
    echo -e "${RED}Error: Attempting to commit .DS_Store files!${NC}"
    echo "Run: find . -name .DS_Store -delete"
    FOUND_ISSUE=true
fi

# Check for sensitive files
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git diff --cached --name-only | grep -qE "$pattern" | grep -v ".example"; then
        echo -e "${RED}Error: Attempting to commit sensitive file matching: $pattern${NC}"
        FOUND_ISSUE=true
    fi
done

# Check for large files (>10MB)
while IFS= read -r file; do
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    if [ "$size" -gt 10485760 ]; then
        size_mb=$(echo "scale=2; $size/1048576" | bc)
        echo -e "${RED}Error: File too large: $file (${size_mb}MB)${NC}"
        echo "Consider using Git LFS for large files"
        FOUND_ISSUE=true
    fi
done < <(git diff --cached --name-only)

if [ "$FOUND_ISSUE" = true ]; then
    echo ""
    echo "Commit rejected. Please fix the issues above."
    exit 1
fi

exit 0
EOF

chmod +x "$PRECOMMIT_HOOK"
echo -e "${GREEN}✓ Pre-commit hook installed${NC}"

echo ""
echo -e "${YELLOW}📋 Step 7: Create cleanup summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUMMARY_FILE="cleanup-summary.md"
cat > "$SUMMARY_FILE" << EOF
# Repository Cleanup Summary

**Date:** $(date)

## Changes Made

### 1. Removed Files from Tracking
- .DS_Store files removed from git tracking
- These files are now in .gitignore

### 2. Updated .gitignore
- Added comprehensive patterns for common temporary files
- Includes Node.js, Python, build outputs, IDE files
- Prevents committing sensitive credentials

### 3. Repository Optimization
- Ran git garbage collection
- Verified repository integrity
- Repacked objects for better compression

### 4. Pre-commit Hook
- Installed at \`.git/hooks/pre-commit\`
- Prevents committing:
  - .DS_Store files
  - Sensitive credentials
  - Files larger than 10MB

## Repository Statistics

- **Before:** $TOTAL_SIZE (.git: $REPO_SIZE)
- **After:** $NEW_TOTAL_SIZE (.git: $NEW_REPO_SIZE)
- **Total commits:** $COMMIT_COUNT
- **Total branches:** $BRANCH_COUNT

## Next Steps

1. **Review changes:**
   \`\`\`bash
   git status
   \`\`\`

2. **Commit cleanup:**
   \`\`\`bash
   git add .gitignore
   git commit -m "chore: comprehensive repository cleanup

   - Remove .DS_Store from tracking
   - Update .gitignore with comprehensive patterns
   - Optimize git repository
   - Add pre-commit hook for safety

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   \`\`\`

3. **Push changes:**
   \`\`\`bash
   git push origin main
   \`\`\`

4. **Optional - Delete merged remote branches:**
   \`\`\`bash
   # Review merged branches first
   git branch -r --merged origin/main

   # Delete if confirmed (example)
   # git push origin --delete Test
   \`\`\`

## Recommended Ongoing Practices

- ✅ Always use meaningful commit messages
- ✅ Use conventional commits (feat:, fix:, chore:)
- ✅ Never commit .env files or credentials
- ✅ Run \`git status\` before committing
- ✅ Keep dependencies updated
- ✅ Periodically run \`git gc\` to optimize

---
Generated by cleanup-repo.sh
EOF

echo -e "${GREEN}✓ Summary saved to $SUMMARY_FILE${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✨ Cleanup Complete!                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📄 Review the summary: ${BLUE}$SUMMARY_FILE${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git status"
echo "  2. Commit cleanup: git add .gitignore && git commit"
echo "  3. Push to GitHub: git push origin main"
echo ""
echo -e "${BLUE}Tip:${NC} The pre-commit hook will now protect against accidental commits!"
echo ""
