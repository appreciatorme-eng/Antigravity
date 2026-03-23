# Live Location Tracking

## Overview

TripBuilt provides real-time driver location sharing with trip guests. Drivers publish GPS coordinates during active trips, and admins or clients generate tokenized shareable links that allow unauthenticated guests to view the driver's live location on a map.

### Key Source Files

| File | Purpose |
|------|---------|
| `src/app/api/_handlers/location/ping/route.ts` | Driver GPS publishing endpoint |
| `src/app/api/_handlers/location/share/route.ts` | Admin: create/get/revoke share links |
| `src/app/api/_handlers/location/client-share/route.ts` | Client: create/get share links |
| `src/app/api/_handlers/location/live/[token]/route.ts` | Guest: access location data via token |
| `src/app/api/_handlers/location/cleanup-expired/route.ts` | Cron: deactivate expired shares |

---

## Driver GPS Publishing

### Endpoint: `POST /api/location/ping`

Authenticated drivers publish their GPS coordinates to the `driver_locations` table.

### Request Payload

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tripId` | UUID | Yes | Must be a valid UUID |
| `latitude` | number | Yes | -90 to 90 |
| `longitude` | number | Yes | -180 to 180 |
| `heading` | number | No | Direction of travel |
| `speed` | number | No | Speed in m/s |
| `accuracy` | number | No | GPS accuracy in meters |
| `driverId` | UUID | No | Admin override for which driver to record |

### Authorization

1. Bearer token authentication required
2. User's profile and role are resolved
3. Trip must exist and belong to the same organization (unless super_admin)
4. The caller must be either:
   - The trip's primary driver (`trip.driver_id`)
   - An assigned driver via `trip_driver_assignments` + `driver_accounts`
   - An admin or super_admin (can also override `driverId`)

### Throttling

To prevent GPS spam, the handler checks the most recent `driver_locations` entry for the same trip + driver. If the last ping was less than **5 seconds** ago, the request returns `{ ok: true, throttled: true }` without inserting.

### Rate Limiting

120 requests per minute per authenticated user (`api:location:ping` prefix).

### `driver_locations` Table

| Column | Type | Description |
|--------|------|-------------|
| `driver_id` | UUID | Profile ID of the driver |
| `trip_id` | UUID | Associated trip (nullable for WhatsApp pings) |
| `latitude` | float | GPS latitude |
| `longitude` | float | GPS longitude |
| `heading` | float | Direction of travel (nullable) |
| `speed` | float | Speed (nullable) |
| `accuracy` | float | GPS accuracy in meters (nullable) |
| `recorded_at` | timestamp | When the location was recorded |

---

## Location Share Links

### Admin Share Management: `/api/location/share`

Admins create, retrieve, and revoke share links for trips.

#### GET -- Retrieve Active Share

Returns the most recent active, non-expired share for a trip (optionally filtered by `dayNumber`).

#### POST -- Create Share Link

1. Check for an existing active share (reuse if found)
2. Generate a share token: `crypto.randomUUID()` with dashes removed (32 hex chars)
3. Set expiry: configurable 1-168 hours (default 24 hours)
4. Insert into `trip_location_shares`
5. Return the share with `live_url`: `{APP_URL}/live/{token}`

#### DELETE -- Revoke Share Links

Deactivates shares by setting `is_active: false` and `expires_at` to now. Can target a specific `shareId` or all active shares for a trip/day. Logs a notification for audit.

### Client Share Management: `/api/location/client-share`

Clients (trip guests) can retrieve or create shares for trips where they are the `client_id`.

- Same create/reuse logic as admin shares
- Default expiry: **48 hours** (vs. admin's configurable 1-168 hours)
- Authorization: `trip.client_id === userId`

---

## Token Security

### Token Format

Share tokens are 32-character hex strings generated from `crypto.randomUUID()` with dashes removed. The live endpoint validates format with `/^[a-f0-9]{32}$/i`.

### Expiry

- Admin shares: configurable 1-168 hours (default 24 hours)
- Client shares: fixed 48 hours
- Expired shares are automatically deactivated by the cleanup cron

### Access Logging and Rate Limiting

The live token endpoint enforces rate limiting per token + client IP combination:

| Parameter | Value |
|-----------|-------|
| Window | 60 seconds |
| Max requests | 40 per window |
| Key | `{token}:{clientIp}` |
| Prefix | `api:location:live:get` |

### Cleanup Cron: `POST /api/location/cleanup-expired`

Deactivates all shares where `expires_at < now` and `is_active = true`. Authorized by:

- Cron secret (`NOTIFICATION_CRON_SECRET`)
- Signed cron request (HMAC-SHA256 with `NOTIFICATION_SIGNING_SECRET`)
- Service role Bearer token
- Admin user session

---

## Guest Access

### Endpoint: `GET /api/location/live/{token}`

No authentication required. Guests access location data using only the share token.

### Response

The endpoint returns a comprehensive payload:

```json
{
  "share": {
    "trip_id": "uuid",
    "day_number": 1,
    "expires_at": "2026-03-24T12:00:00Z"
  },
  "trip": {
    "destination": "Goa",
    "start_date": "2026-03-23",
    "end_date": "2026-03-28",
    "client_name": "John Doe"
  },
  "assignment": {
    "day_number": 1,
    "pickup_time": "08:00",
    "pickup_location": "Hotel Lobby",
    "external_drivers": {
      "full_name": "Driver Name",
      "phone": "+919876543210",
      "vehicle_type": "SUV",
      "vehicle_plate": "KA01AB1234"
    }
  },
  "location": {
    "latitude": 15.4989,
    "longitude": 73.8278,
    "heading": 180,
    "speed": 45.5,
    "accuracy": 10,
    "recorded_at": "2026-03-23T10:30:00Z",
    "driver_id": "uuid"
  }
}
```

### Data Joins

The endpoint performs multiple queries:

1. **Share validation**: `trip_location_shares` with `is_active = true` and token match
2. **Trip details**: Joined via `trips` relation, including client profile (`full_name`)
3. **Latest location**: Most recent `driver_locations` entry for the trip
4. **Driver assignment**: `trip_driver_assignments` with `external_drivers` details (name, phone, vehicle)

---

## Supabase Realtime

Location updates stream to clients using Supabase's realtime subscription capabilities. The `driver_locations` table supports realtime change notifications, allowing the guest-facing live tracking page to receive location updates as they are inserted without polling.

The guest page subscribes to changes on `driver_locations` filtered by `trip_id`, receiving `INSERT` events in real-time.

---

## `can_publish_driver_location()`

A Supabase database function (RPC) that provides authorization at the database level:

```sql
can_publish_driver_location(actor_user_id: string, target_trip_id: string) -> boolean
```

This function validates whether a given user is authorized to publish location data for a specific trip. It is complementary to the API-level authorization in the ping handler, providing defense-in-depth at the database layer.

---

## Access Logging

### `trip_location_share_access_logs`

Access to live tracking links is logged for security and analytics:

- Tracks who accessed which share token
- Used as input for rate limiting decisions
- Referenced in admin security diagnostics (`src/app/api/_handlers/admin/security/diagnostics/route.ts`)

---

## Driver Location Publishing Flow

```mermaid
sequenceDiagram
    participant Driver as Driver App
    participant API as Location Ping API
    participant DB as Supabase DB
    participant RT as Supabase Realtime
    participant Guest as Guest Browser

    Note over Driver,Guest: Driver Publishes Location
    Driver->>API: POST /api/location/ping {tripId, lat, lng, heading, speed}
    API->>API: Authenticate (Bearer token)
    API->>DB: Verify profile role + trip assignment
    API->>DB: Check throttle (last ping < 5s ago?)
    alt Not throttled
        API->>DB: INSERT driver_locations
        DB->>RT: Realtime broadcast (INSERT on driver_locations)
        API-->>Driver: { ok: true }
    else Throttled
        API-->>Driver: { ok: true, throttled: true }
    end

    Note over Driver,Guest: Admin Creates Share Link
    API->>DB: INSERT trip_location_shares (token, expires_at)
    API-->>API: Build URL: /live/{token}

    Note over Driver,Guest: Guest Views Live Location
    Guest->>API: GET /api/location/live/{token}
    API->>API: Validate token format (32 hex chars)
    API->>API: Rate limit check (40/min per token+IP)
    API->>DB: Fetch share + trip + assignment + latest location
    API-->>Guest: Share details + trip info + location data
    Guest->>RT: Subscribe to driver_locations (filter: trip_id)
    RT-->>Guest: Real-time location updates (INSERT events)
```

## Location Sharing Data Model

```mermaid
erDiagram
    trips ||--o{ driver_locations : "has"
    trips ||--o{ trip_location_shares : "has"
    trips ||--o{ trip_driver_assignments : "has"
    profiles ||--o{ driver_locations : "driver_id"
    trip_location_shares ||--o{ trip_location_share_access_logs : "tracks"
    trip_driver_assignments }o--|| external_drivers : "assigned"

    trips {
        uuid id PK
        uuid organization_id FK
        uuid driver_id FK
        uuid client_id FK
        string destination
        string status
        date start_date
        date end_date
    }

    driver_locations {
        uuid id PK
        uuid driver_id FK
        uuid trip_id FK
        float latitude
        float longitude
        float heading
        float speed
        float accuracy
        timestamp recorded_at
    }

    trip_location_shares {
        uuid id PK
        uuid trip_id FK
        int day_number
        string share_token
        uuid created_by FK
        boolean is_active
        timestamp expires_at
        timestamp created_at
    }

    trip_location_share_access_logs {
        uuid id PK
        uuid share_id FK
        string client_ip
        timestamp accessed_at
    }

    trip_driver_assignments {
        uuid id PK
        uuid trip_id FK
        int day_number
        string external_driver_id
        string pickup_time
        string pickup_location
    }

    external_drivers {
        uuid id PK
        string full_name
        string phone
        string vehicle_type
        string vehicle_plate
    }

    profiles {
        uuid id PK
        string full_name
        string role
        string phone_normalized
        uuid organization_id FK
    }
```
