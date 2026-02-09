---
name: mapcn
version: 1.0.0
description: A skill to integrate 'mapcn', an out-of-the-box map component library for React/Next.js using MapLibre GL and Tailwind CSS.
---
# mapcn Skill

This skill provides utilities to quickly add `mapcn` components to your React/Next.js applications.
`mapcn` is built on MapLibre GL and styled with Tailwind CSS, compatible with shadcn/ui.

## Prerequisites

Your project must have the following dependencies installed and configured:
- [Next.js](https://nextjs.org/) (App Directory recommended)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) CLI configured

## Installation

To add the `mapcn` components to your project, run the installation script:

```bash
# From project root
./skills/mapcn/scripts/install-mapcn.sh
```

Or manually running the shadcn add command:

```bash
npx shadcn@latest add https://mapcn.dev/maps/map.json
```

This will:
1.  Install `maplibre-gl` dependency.
2.  Add `components/ui/map.tsx` (and related files) to your project.

## Usage

### 1. Basic Map

Import the `Map` and `MapControls` components:

```tsx
import { Map, MapControls } from "@/components/ui/map";
import { Card } from "@/components/ui/card";

export function MyMap() {
  return (
    <Card className="h-[500px] w-full p-0 overflow-hidden relative">
      <Map
        initialViewState={{
          longitude: -74.006,
          latitude: 40.7128,
          zoom: 11
        }}
      >
        <MapControls />
      </Map>
    </Card>
  );
}
```

### 2. Markers

Add markers to your map using the `MapMarker` component (if provided) or standard MapLibre markers.
*Note: Check `components/ui/map.tsx` for available marker components after installation.*

```tsx
import { Map, MapMarker } from "@/components/ui/map";

// ... inside Map component
<MapMarker longitude={-74.006} latitude={40.7128}>
  <div className="bg-primary text-primary-foreground p-2 rounded-full">
    📍
  </div>
</MapMarker>
```

### 3. Routes

For drawing routes, you can use the `MapLayer` or similar components exposed by the library or MapLibre GL directly.

## Resources

- [Official Documentation](https://mapcn.dev/docs)
- [GitHub Repository](https://github.com/AnmolSaini16/mapcn)
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js-docs/api/)
