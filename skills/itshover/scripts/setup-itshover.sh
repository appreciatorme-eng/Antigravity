#!/bin/bash
# Install 'motion' dependency for 'itshover' icons
# Usage: ./skills/itshover/scripts/setup-itshover.sh

set -e

# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then
    CMD="pnpm add motion"
elif [ -f "yarn.lock" ]; then
    CMD="yarn add motion"
else
    CMD="npm install motion"
fi

echo "Installing dependency: motion..."
echo "Running: $CMD"
$CMD

echo "Setup complete. You can now add icons from itshover.com using shadcn CLI."
echo "Examples:"
echo "  npx shadcn@latest add https://itshover.com/r/github.json"
