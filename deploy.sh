#!/bin/bash

# Travel Suite - Vercel Deployment Script
# Usage: ./deploy.sh [prod]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Travel Suite - Vercel Deployment                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the monorepo root
if [ ! -d "projects/travel-suite/apps/web" ]; then
    echo -e "${RED}Error: Must run from monorepo root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Navigate to web app
cd projects/travel-suite/apps/web
echo -e "${GREEN}✓${NC} Working directory: $(pwd)"

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not found${NC}"
    echo ""
    echo "Install with:"
    echo "  npm install -g vercel@latest"
    exit 1
fi

echo -e "${GREEN}✓${NC} Vercel CLI found: $(vercel --version)"

# Check if project is linked
if [ ! -d .vercel ]; then
    echo -e "${YELLOW}⚠${NC}  Project not linked to Vercel"
    echo ""
    echo "Run the following to link:"
    echo "  cd projects/travel-suite/apps/web"
    echo "  vercel link"
    echo ""
    read -p "Would you like to link now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel link
    else
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Project linked to Vercel"
echo ""

# Check for environment variables
echo -e "${YELLOW}📋 Checking environment variables...${NC}"

REQUIRED_VARS=(
    "GOOGLE_API_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    # Check if variable exists in Vercel (this will show in vercel env ls)
    if ! vercel env ls 2>&1 | grep -q "$var"; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Some environment variables may not be set in Vercel:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Set them with:"
    echo "  vercel env add $var production"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Determine deployment type
if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    DEPLOY_TYPE="production"
    echo -e "${GREEN}📦 Deploying to PRODUCTION${NC}"
else
    DEPLOY_TYPE="preview"
    echo -e "${BLUE}🔍 Deploying PREVIEW${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Deploy
if [ "$DEPLOY_TYPE" = "production" ]; then
    vercel --prod
else
    vercel
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deployment Complete!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DEPLOY_TYPE" = "production" ]; then
    echo -e "${BLUE}Production URL:${NC} https://travelsuite-rust.vercel.app"
else
    echo -e "${BLUE}Preview URL:${NC} Check output above"
fi

echo ""
