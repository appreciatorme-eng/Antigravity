# Stitch Design References

This folder stores exported UX references from Google Stitch so we have a stable, versioned source of truth for implementation work.

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

## How To Refresh

From the project root:

```bash
cd projects/travel-suite/docs/stitch/15964200879465447191
./fetch.sh
```

If Stitch regenerates or changes asset URLs, update `fetch.sh` and commit the refreshed exports alongside the app implementation changes.

