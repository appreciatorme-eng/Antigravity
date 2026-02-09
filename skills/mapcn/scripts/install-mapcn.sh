#!/bin/bash
# Install mapcn component into the current project
# Usage: ./skills/mapcn/scripts/install-mapcn.sh

set -e

# Check if shadcn is installed (dev dependency or global) or available via npx
if ! command -v npx > /dev/null; then
    echo "Error: npx command not found. Please install node.js and npm."
    exit 1
fi

echo "Installing mapcn components using shadcn..."

# Run the shadcn add command
# This assumes it's run from the root of a Next.js/React project with shadcn configured
npx shadcn@latest add https://mapcn.dev/maps/map.json

echo "mapcn installation complete."
