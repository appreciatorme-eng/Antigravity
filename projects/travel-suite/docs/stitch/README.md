# Stitch Design References

This folder stores exported UX references from Google Stitch so we have a stable, versioned source of truth for implementation work.

## Specs

- `DESIGN_IMPLEMENTATION_SPEC.md`: the implementation checklist and token spec for the Stitch exports.

## Project

- Stitch project: https://stitch.withgoogle.com/projects/15964200879465447191

## What Is Saved Here

Under `15964200879465447191/` you will find:

- `*.png`: screen previews (visual ground truth)
- `*.html`: exported UI markup (layout + color tokens)
- `fetch.sh`: re-download script for the exact assets currently tracked

Current key screens:

- `auth_portal.(png|html)`
- `traveler_dashboard.(png|html)`
- `itinerary_timeline.(png|html)`
- `driver_command.(png|html)`

## Mobile Implementation Mapping (Flutter)

These Stitch exports are implemented as wireframes in the Flutter mobile app:

- Auth portal: `projects/travel-suite/apps/mobile/lib/features/auth/presentation/screens/auth_screen.dart`
- Traveler dashboard: `projects/travel-suite/apps/mobile/lib/features/trips/presentation/widgets/traveler_dashboard_stitch.dart`
- Itinerary timeline: `projects/travel-suite/apps/mobile/lib/features/trips/presentation/screens/itinerary_timeline_screen.dart`
- Driver command: `projects/travel-suite/apps/mobile/lib/features/trips/presentation/widgets/driver_dashboard.dart`

## How To Refresh

From the project root:

```bash
cd projects/travel-suite/docs/stitch/15964200879465447191
./fetch.sh
```

If Stitch regenerates or changes asset URLs, update `fetch.sh` and commit the refreshed exports alongside the app implementation changes.
