# Implementation Plan - TravelSuite MVP Phase 1

## Goal Description
Initialize the TravelSuite project structure and implement the core data and AI foundations. This includes setting up the Monorepo, defining the SQL schema for Supabase, and creating the server-side logic for the AI Itinerary Engine using Claude.

## Proposed Changes

### 1. Project Structure
**Directory**: `projects/travel-suite`
```text
├── apps
│   ├── mobile/         # Expo (React Native)
│   └── web/            # Next.js (Owner Dashboard)
├── packages
│   └── shared/         # Shared types/utils (Future expansion)
└── supabase
    └── migrations/     # SQL Schema
```

### 2. Database Schema (Supabase)
#### [NEW] [projects/travel-suite/supabase/schema.sql](file:///Users/justforfun/Agent_Antigravity/projects/travel-suite/supabase/schema.sql)
- **Tables**:
    - `profiles`: Users (Owner/Driver/Client) linked to Auth.
    - `trips`: Core booking entity containing the JSON itinerary.
    - `locations`: Real-time GPS data.
    - `finances`: Ledger for expenses and income.
- **Security**: RLS policies (e.g., Drivers can only write their own location).

### 3. AI Itinerary Engine (Next.js API)
#### [NEW] [projects/travel-suite/apps/web/app/api/itinerary/generate/route.ts](file:///Users/justforfun/Agent_Antigravity/projects/travel-suite/apps/web/app/api/itinerary/generate/route.ts)
- **Endpoint**: `POST /api/itinerary/generate`
- **Logic**:
    1.  Receive natural language prompt.
    2.  **Call Gemini 1.5 Flash API** (Free Tier) to generate structured JSON.
    3.  Fetch images from Unsplash based on keywords.
    4.  Return enriched itinerary.

### 4. PDF Generation (Client-Side)
- **Library**: `@react-pdf/renderer`
- **Implementation**: Runs entirely in the browser on the Web Dashboard. Generates the PDF Blob and uploads to Supabase Storage for sharing.

### 5. Integration Layer (Free Tier)
#### [NEW] [projects/travel-suite/apps/web/lib/external/weather.ts](file:///Users/justforfun/Agent_Antigravity/projects/travel-suite/apps/web/lib/external/weather.ts)
- **Source**: [Open-Meteo](https://open-meteo.com)
- **Limit**: 10,000 calls/day (Free)
- **Usage**: Fetch 7-day forecast for itinerary locations.

#### [NEW] [projects/travel-suite/apps/web/lib/external/currency.ts](file:///Users/justforfun/Agent_Antigravity/projects/travel-suite/apps/web/lib/external/currency.ts)
- **Source**: [ExchangeRate-API](https://www.exchangerate-api.com)
- **Usage**: Convert budget estimates to local currency.

#### [NEW] [projects/travel-suite/apps/web/lib/external/maps.ts](file:///Users/justforfun/Agent_Antigravity/projects/travel-suite/apps/web/lib/external/maps.ts)
- **Source**: Mapbox GL JS (Free Tier)
- **Usage**: Interactive itinerary maps.

### 6. Design System (GoBuddy Identity)
- **Primary Color (Action)**: `#00d084` (Vivid Green) - *Used for "Book Now", "Generate" buttons.*
- **Secondary Color (Brand)**: `#124ea2` (Royal Blue) - *Used for Headers, Navigation.*
- **Background**: `#ffffff` (White) / `#f8f9fa` (Light Gray)
- **Typography**:
    -   **Headings**: `Cormorant Garamond` (Serif) - *For itinerary titles, "Travel Magazine" feel.*
    -   **Body/UI**: `Poppins` (Sans-serif) - *For inputs, functional text.*
- **Logo**: `https://gobuddyadventures.com/wp-content/uploads/2021/12/GoBuddy-Full-Logo-Transparent-1.png`

## Verification Plan
1.  **Schema**: Manually review SQL for integrity and relationship correctness.
2.  **API**: Create a test script to mock a request to the route and validate the JSON structure returned.
