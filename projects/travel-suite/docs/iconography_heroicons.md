# Iconography (Heroicons)

We use the Heroicons set as the single, consistent icon language across the Travel Suite projects (mobile + web + admin) to keep the UI cohesive and reduce “mixed icon” visual noise.

Source of truth:
- Figma: https://www.figma.com/design/8WNsSW52Z6vgJL9ZfIKF6T/Heroicons--Community-?node-id=0-1

## Principles
- Use one style per surface: prefer **Outline** for UI chrome and lists; use **Solid** sparingly for high-emphasis actions and states.
- Keep icon sizes consistent: default `20` for inline icons, `24` for leading section icons, `16` for small “pill” icons.
- Avoid mixing Material Icons with Heroicons within the same screen.
- Prefer semantic icon mapping: pick icons based on meaning, not “what looks close”.

## Flutter (Android/iOS)
- Dependency: `heroicons` (Flutter)
- Use `HeroIcon(HeroIcons.*)` rather than `Icon(Icons.*)` for new UI work.
- Prefer wrapping icon usage behind a small helper (example: `AppIcon`) so we can tune default sizes/colors centrally.

## Web (Next.js)
- Recommended dependency: `@heroicons/react`
- Use a thin wrapper component for sizing and default classes (example: `AppIcon`).

## Migration Guidance
We are migrating incrementally.
- New screens: must use Heroicons only.
- Existing screens: migrate opportunistically when you touch the file for UX work.

