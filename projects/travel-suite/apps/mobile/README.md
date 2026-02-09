# GoBuddy Mobile App

A cross-platform mobile application for GoBuddy users, built with [Flutter](https://flutter.dev/).

## Features

*   **Authentication**: Magic Link login via Supabase Auth.
*   **Trips Overview**: View upcoming and past trips with animated card transitions.
*   **Detailed Itinerary**: Visual timeline of daily activities with maps and collapsible header.
*   **Driver Integration**: View assigned driver details (photo, vehicle, contact).
*   **Notifications**: Local notifications for key events (e.g., "I've Landed").
*   **Mapping**: Interactive maps powered by `flutter_map` and OpenStreetMap.
*   **Premium UI**: Modern design with gradients, shimmer loading, Hero transitions, and smooth animations.

## Tech Stack

*   **Framework**: Flutter (Dart)
*   **Backend**: Supabase (Postgres, Auth, Storage)
*   **State Management**: `flutter_riverpod` (simpler `setState` used for Phase 1 prototypes)
*   **Navigation**: `go_router`
*   **Code Generation**: `freezed` & `json_serializable`

## Key Dependencies

| Package | Purpose |
|---------|--------|
| `supabase_flutter` | Backend integration |
| `flutter_map` | Interactive maps |
| `flutter_animate` | Smooth UI animations |
| `shimmer` | Loading skeleton effects |
| `sliver_tools` | Advanced scroll layouts |
| `flutter_local_notifications` | Local push notifications |
| `cached_network_image` | Image caching |

## Project Structure

```
lib/
├── core/               # Core functionality (Config, Theme, Services)
├── features/           # Feature-based modules
│   ├── auth/           # Authentication logic & UI
│   └── trips/          # Trips management (List, Details, Drivers)
└── main.dart           # Application entry point
```

## Setup & Running

### Prerequisites

1.  [Flutter SDK](https://docs.flutter.dev/get-started/install) installed.
2.  Supabase project configured.

### Configuration

1.  **Supabase Credentials**:
    Ensure `lib/core/config/supabase_config.dart` contains your Supabase URL and Anon Key.

2.  **Code Generation**:
    This project uses `freezed`. Run the build runner to generate necessary files:
    ```bash
    dart run build_runner build --delete-conflicting-outputs
    ```

3.  **Dependencies**:
    Install Flutter packages:
    ```bash
    flutter pub get
    ```

### Running the App

*   **Android**:
    ```bash
    flutter run -d android
    ```
*   **iOS** (macOS only):
    ```bash
    cd ios && pod install && cd ..
    flutter run -d ios
    ```

## Deep Linking

Authentication callbacks are handled via custom schemes:
*   **Scheme**: `com.gobuddy.gobuddymobile`
*   **Host**: `login-callback`

Ensure your Supabase Auth Redirect URLs include: `com.gobuddy.gobuddymobile://login-callback`

## Notes

*   **"I've Landed" Feature**: Currently simulates a backend update by directly modifying trip status and showing a local notification. In production, this trigger an Edge Function.
*   **Maps**: Uses OpenStreetMap tiles. Ensure appropriate attribution is displayed.
