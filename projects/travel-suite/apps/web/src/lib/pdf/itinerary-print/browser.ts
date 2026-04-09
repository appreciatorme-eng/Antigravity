import { access } from 'node:fs/promises';
import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';

const LOCAL_EXECUTABLE_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean) as string[];

const canAccess = async (filePath: string) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const resolveExecutablePath = async (): Promise<string> => {
  if (process.env.VERCEL || process.platform === 'linux') {
    return chromium.executablePath();
  }

  for (const candidate of LOCAL_EXECUTABLE_CANDIDATES) {
    if (await canAccess(candidate)) {
      return candidate;
    }
  }

  return chromium.executablePath();
};

export const launchItineraryPdfBrowser = async () => {
  chromium.setGraphicsMode = false;
  const executablePath = await resolveExecutablePath();
  const args =
    process.env.VERCEL || process.platform === 'linux'
      ? [...chromium.args, '--hide-scrollbars']
      : ['--disable-dev-shm-usage', '--font-render-hinting=medium'];

  return playwrightChromium.launch({
    executablePath,
    headless: true,
    args,
  });
};
