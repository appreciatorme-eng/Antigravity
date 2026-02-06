# UI Design Resources & Best Practices

A curated collection of the best UI libraries, icon sets, and design resources for building beautiful applications.

---

## Icon Libraries

### Free & Open Source

| Library | Icons | Weights | Best For | Link |
|---------|-------|---------|----------|------|
| **Lucide** | 1400+ | 1 | Clean, minimal apps | [lucide.dev](https://lucide.dev) |
| **Phosphor** | 7000+ | 6 | Versatile, any style | [phosphoricons.com](https://phosphoricons.com) |
| **Heroicons** | 450+ | 2 | Tailwind projects | [heroicons.com](https://heroicons.com) |
| **Tabler Icons** | 4000+ | 2 | Consistent stroke | [tabler-icons.io](https://tabler-icons.io) |
| **Feather** | 280+ | 1 | Simple, lightweight | [feathericons.com](https://feathericons.com) |
| **Remix Icon** | 2800+ | 2 | Material-like | [remixicon.com](https://remixicon.com) |
| **IconPark** | 2400+ | 4 | ByteDance quality | [iconpark.oceanengine.com](https://iconpark.oceanengine.com) |

### React Native Packages
```bash
# Lucide (recommended)
npm install lucide-react-native react-native-svg

# Phosphor
npm install phosphor-react-native react-native-svg

# Vector Icons (includes multiple sets)
npm install @expo/vector-icons
```

### React/Next.js Packages
```bash
# Lucide
npm install lucide-react

# Heroicons
npm install @heroicons/react

# Phosphor
npm install @phosphor-icons/react
```

---

## React Native UI Kits

### Production-Ready Libraries

| Library | Style | Expo? | Link |
|---------|-------|-------|------|
| **Tamagui** | Custom/Fast | Yes | [tamagui.dev](https://tamagui.dev) |
| **NativeWind** | Tailwind CSS | Yes | [nativewind.dev](https://nativewind.dev) |
| **React Native Paper** | Material 3 | Yes | [callstack.github.io/react-native-paper](https://callstack.github.io/react-native-paper) |
| **Gluestack UI** | Modern/Accessible | Yes | [gluestack.io](https://gluestack.io) |
| **React Native Elements** | Cross-platform | Yes | [reactnativeelements.com](https://reactnativeelements.com) |
| **NativeBase** | Utility-first | Yes | [nativebase.io](https://nativebase.io) |
| **Dripsy** | Responsive | Yes | [dripsy.xyz](https://dripsy.xyz) |

### Installation Examples
```bash
# Tamagui (fastest, most customizable)
npm install tamagui @tamagui/core @tamagui/config

# NativeWind (Tailwind for RN)
npm install nativewind
npm install -D tailwindcss

# React Native Paper (Material Design)
npm install react-native-paper react-native-safe-area-context
```

---

## Animation Libraries

| Library | Use Case | Link |
|---------|----------|------|
| **Lottie** | After Effects animations | [lottiefiles.com](https://lottiefiles.com) |
| **Reanimated** | Complex gestures/animations | [docs.swmansion.com/react-native-reanimated](https://docs.swmansion.com/react-native-reanimated) |
| **Moti** | Simple declarative animations | [moti.fyi](https://moti.fyi) |
| **React Native Skia** | High-perf graphics | [shopify.github.io/react-native-skia](https://shopify.github.io/react-native-skia) |

```bash
# Lottie
npm install lottie-react-native

# Reanimated
npm install react-native-reanimated

# Moti (uses Reanimated)
npm install moti react-native-reanimated
```

---

## Best React Native Starter Templates

| Template | Features | Link |
|----------|----------|------|
| **Obytes Template** | TypeScript, ESLint, Husky, i18n | [github.com/obytes/react-native-template-obytes](https://github.com/obytes/react-native-template-obytes) |
| **Ignite** | MobX, TypeScript, CLI | [github.com/infinitered/ignite](https://github.com/infinitered/ignite) |
| **create-expo-app** | Official Expo starter | `npx create-expo-app` |
| **Expo Router Starter** | File-based routing | `npx create-expo-app -t tabs` |

---

## Web UI Libraries (React/Next.js)

| Library | Style | Best For |
|---------|-------|----------|
| **shadcn/ui** | Tailwind + Radix | Most projects |
| **Radix UI** | Headless primitives | Custom design systems |
| **Chakra UI** | Component library | Fast prototyping |
| **Mantine** | Full-featured | Data-heavy apps |
| **Headless UI** | Tailwind Labs | Tailwind projects |
| **Ark UI** | Headless + Zag.js | Framework-agnostic |

---

## Design Inspiration

### Dribbble Collections
- [Mobile App Designs](https://dribbble.com/tags/mobile_app)
- [Travel App UI](https://dribbble.com/search/travel-app)
- [Dashboard UI](https://dribbble.com/search/dashboard)

### GitHub Showcases
| Repo | Description |
|------|-------------|
| [awesome-react-native](https://github.com/jondot/awesome-react-native) | Curated RN resources |
| [react-native-showcase](https://github.com/eveningkid/react-native-showcase) | Beautiful RN examples |
| [made-with-react-native](https://github.com/nicklockwood/iCarousel) | Production apps |

### Design Systems to Study
- [Airbnb Design](https://airbnb.design)
- [Uber Design](https://www.uber.design)
- [Shopify Polaris](https://polaris.shopify.com)
- [GitHub Primer](https://primer.style)

---

## Color Palette Tools

| Tool | Purpose | Link |
|------|---------|------|
| **Coolors** | Palette generator | [coolors.co](https://coolors.co) |
| **Realtime Colors** | Preview on real UI | [realtimecolors.com](https://realtimecolors.com) |
| **Happy Hues** | Curated palettes | [happyhues.co](https://happyhues.co) |
| **ColorHunt** | User-submitted palettes | [colorhunt.co](https://colorhunt.co) |
| **Tailwind Colors** | Named color scales | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/customizing-colors) |

---

## Typography

### Free Font Sources
- [Google Fonts](https://fonts.google.com) - Most popular
- [Font Share](https://www.fontshare.com) - High-quality free fonts
- [Fontsource](https://fontsource.org) - Self-hosted web fonts

### Recommended Font Pairings
| Heading | Body | Vibe |
|---------|------|------|
| Inter | Inter | Clean, modern |
| Poppins | Inter | Friendly, tech |
| Playfair Display | Lato | Elegant, editorial |
| Space Grotesk | DM Sans | Tech, startup |
| Cormorant Garamond | Poppins | Luxury, travel |

---

## Component Patterns

### Bottom Sheets
```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

### Image Handling
```bash
npm install expo-image  # Fast, cached images
```

### Forms
```bash
npm install react-hook-form zod @hookform/resolvers
```

### Date/Time Pickers
```bash
npm install react-native-modal-datetime-picker @react-native-community/datetimepicker
```

---

## Quick Reference Commands

### Start New Expo Project with Best Practices
```bash
# Create app
npx create-expo-app@latest my-app -t tabs

# Add essentials
cd my-app
npm install lucide-react-native react-native-svg
npm install @supabase/supabase-js expo-secure-store
npm install react-native-reanimated
npm install nativewind
npm install -D tailwindcss
```

### Start New Next.js Project
```bash
# Create app
npx create-next-app@latest my-app --typescript --tailwind --eslint

# Add shadcn/ui
npx shadcn-ui@latest init

# Add icons
npm install lucide-react
```

---

## Recommended Stack for 2026

### Mobile (React Native + Expo)
- **Routing**: Expo Router
- **Styling**: NativeWind (Tailwind)
- **Icons**: Lucide
- **Animations**: Moti + Reanimated
- **State**: Zustand or Jotai
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase

### Web (Next.js)
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide
- **State**: Zustand or React Query
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase

---

*Last updated: February 2026*
