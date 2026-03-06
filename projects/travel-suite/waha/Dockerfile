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
  c=c.replace('startAllSession: true', 'startAllSession: true, deleteSessionOnLogout: true'); \
  fs.writeFileSync('./dist/config.js',c); \
  console.log('config.js patched:', c.includes('process.env.SECRET_KEY') && c.includes('deleteSessionOnLogout'));"

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

# Patch WPPConnect library defaults in create-config.js:
#
# 1. autoClose: 60000 → 0  (disabled)
#    The server NEVER forwards autoClose from req.body to create(), so the library
#    always uses its compiled default of 60 s, killing sessions before Chrome
#    finishes loading WhatsApp Web (~79 s on shared-cpu-1x).
#
# 2. whatsappVersion → latest from @wppconnect/wa-version
#    The hardcoded version (e.g. '2.3000.10305x') is quickly out-of-date.
#    WhatsApp hard-blocks old versions: QR scans succeed (qrReadSuccess fires)
#    but device pairing is immediately rejected with "couldn't link device".
#    Using getLatestVersion() picks the newest alpha accepted by WhatsApp servers.
RUN node -e "const fs=require('fs'); \
  const p='./node_modules/@wppconnect-team/wppconnect/dist/config/create-config.js'; \
  let c=fs.readFileSync(p,'utf8'); \
  c=c.replace('autoClose: 60000', 'autoClose: 0'); \
  const latestVer=require('@wppconnect/wa-version').getLatestVersion(); \
  c=c.replace(/whatsappVersion: '[^']*'/, \"whatsappVersion: '\" + latestVer + \"'\"); \
  fs.writeFileSync(p,c); \
  console.log('create-config.js patched: autoClose=0, whatsappVersion=' + latestVer);"

# Create dirs WPPConnect writes session/token data to
RUN mkdir -p userDataDir tokens

EXPOSE 21465

# Disable Chromium sandboxing inside Docker (no elevated privs available)
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"

CMD ["npm", "start"]
