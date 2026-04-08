# Boneyard Workflow

TripBuilt uses `boneyard-js` only for a few stable, high-traffic loading surfaces:

- Planner itinerary cards
- Trips grid tiles
- Inbox shell

Everything else keeps the existing route-level and manual skeletons.

## Regenerate bones

1. Start the local web app:

```bash
npm run dev
```

2. In a second terminal, generate the bones:

```bash
npm run bones:build
```

This writes refreshed files into [`src/bones/generated`](/Users/justforfun/Documents/New%20project/Antigravity/projects/travel-suite/apps/web/src/bones/generated).
The CLI captures the dedicated [`/bones`](/Users/justforfun/Documents/New%20project/Antigravity/projects/travel-suite/apps/web/src/app/bones/page.tsx) route plus the rest of the app route tree, so the wrappers are always discoverable even if the Planner or Trips pages are behind auth.

## When to rerun it

Rerun the generator after visual changes to:

- [`PastItineraryCard.tsx`](/Users/justforfun/Documents/New%20project/Antigravity/projects/travel-suite/apps/web/src/app/planner/PastItineraryCard.tsx)
- [`TripGridCard.tsx`](/Users/justforfun/Documents/New%20project/Antigravity/projects/travel-suite/apps/web/src/app/trips/TripGridCard.tsx)
- [`UnifiedInbox.tsx`](/Users/justforfun/Documents/New%20project/Antigravity/projects/travel-suite/apps/web/src/components/whatsapp/UnifiedInbox.tsx) when the outer 3-column shell changes materially

## Guardrails

- The generated bones are only a visual enhancement.
- Planner, Trips, and Inbox still keep manual fallbacks if generated bones are missing or stale.
- Do not add `boneyard` to analytics, calendar, detail pages, forms, modals, or admin tables.
