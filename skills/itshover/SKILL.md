---
name: itshover
version: 1.0.0
description: A collection of beautiful, animated icons for React applications. "Icons that move with intent."
---
# Its Hover Skill

This skill provides access to `itshover`, a library of animated icons built with `motion` and designed to work seamlessly with React and Next.js projects.

## Prerequisites

- [Next.js](https://nextjs.org/) or React project
- [npm](https://www.npmjs.com/) or yarn/pnpm
- Dependency: [`motion`](https://motion.dev/)

## Installation

### 1. Install Dependencies
Ensure you have the `motion` package installed in your project:
```bash
npm install motion
# or
yarn add motion
# or
pnpm add motion
```

### 2. Adding Icons
You can add individual icons to your project using the shadcn CLI:

```bash
npx shadcn@latest add https://itshover.com/r/[icon-name].json
```

Example:
```bash
npx shadcn@latest add https://itshover.com/r/github.json
```
This will download the icon component into your project (typically `components/ui` or configured components directory).

## Usage

Import the icon component directly into your React components:

```tsx
import { GithubIcon } from "@/components/ui/github";

export function Footer() {
  return (
    <footer>
      <a href="https://github.com/my-repo">
        <GithubIcon className="h-6 w-6 text-foreground hover:text-primary transition-colors" />
      </a>
    </footer>
  );
}
```

## Available Icons Resources
- [Official Website & Gallery](https://itshover.com/)
- [GitHub Repository](https://github.com/itshover/itshover)

Check the official website to browse available icons and find their specific CLI install commands.
