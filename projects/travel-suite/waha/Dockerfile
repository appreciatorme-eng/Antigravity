# WPPConnect-server — multi-session WhatsApp HTTP API
# Replaces WAHA Core (single session) with WPPConnect (unlimited sessions, free).
#
# Build:   docker build -t wppconnect-server .
# Run:     docker run -p 21465:21465 -e SECRET_KEY=mysecret wppconnect-server

# ── Stage 1: build TypeScript ─────────────────────────────────────────────────
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone latest stable WPPConnect-server
RUN git clone --depth=1 https://github.com/wppconnect-team/wppconnect-server.git .

# Install all deps (including devDependencies for build)
# Use npm install — repo has no package-lock.json
RUN npm install --legacy-peer-deps

# Compile TypeScript → dist/
RUN npm run build

# Patch compiled config so secretKey reads from SECRET_KEY env var at runtime.
# WPPConnect bakes a hardcoded default; this replaces it with a runtime env read.
RUN node -e "const fs=require('fs'); \
  let c=fs.readFileSync('./dist/config.js','utf8'); \
  c=c.replace(\"secretKey: 'THISISMYSECURETOKEN'\", \"secretKey: (process.env.SECRET_KEY||'THISISMYSECURETOKEN')\"); \
  fs.writeFileSync('./dist/config.js',c); \
  console.log('config.js patched:', c.includes('process.env.SECRET_KEY'));"

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:22-slim

# Install Chromium + all Puppeteer system deps (no sandbox needed in container)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium, not download its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy built artefacts + full node_modules from builder
# @babel/runtime and other compile-time deps are required at runtime by dist/server.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create dirs WPPConnect writes session/token data to
RUN mkdir -p userDataDir tokens

EXPOSE 21465

# Disable Chromium sandboxing inside Docker (no elevated privs available)
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"

CMD ["npm", "start"]
