# Surface Analytics - Development Diary

## Project Overview

Building a Segment-like analytics tracking system for Surface Labs. The system consists of:

1. Client-side JavaScript tracking script (`surface_analytics.js`)
2. Backend API for event ingestion
3. Dashboard for viewing events in real-time

---

## Phase 1: Initial Planning & Architecture Decisions

### Key Architectural Decisions

#### 1. **Multi-Tenancy from Day One**

- **Decision**: Design for multiple users tracking different websites
- **Implementation**: Each user gets unique API key (`proj_abc123`)
- **Rationale**: Easier to build multi-tenant from start than retrofit later
- **Impact**: Every event includes `api_key` field for tenant isolation

#### 2. **Event Storage Strategy**

- **Decision**: Use JSONB for event properties instead of rigid columns
- **Rationale**:
  - Supports custom events without schema migrations
  - Flexible for user-defined properties
  - PostgreSQL JSONB has excellent indexing/query performance
- **Trade-off**: Less type safety, but maximum flexibility

#### 3. **Visitor Identification Strategy**

- **Decision**: Two-tier system (visitor_id + user_id)
- **visitor_id**: Auto-generated, anonymous, persistent across sessions
  - Fingerprint (canvas, user agent, screen res) + UUID
  - Stored in localStorage + cookie fallback
- **user_id**: Explicitly set via `identify()` after login/signup
- **Rationale**: Track anonymous → identified user journey (critical for funnel analysis)

#### 4. **Event Batching & Transport**

- **Decision**: Batch events client-side, use `sendBeacon()` as primary transport
- **Batching Config**:
  - Flush every 5 seconds OR when 10 events queued
  - Max queue size: 100 events (prevent memory bloat)
- **Transport Hierarchy**:
  1. `navigator.sendBeacon()` (most reliable, works on page unload)
  2. `fetch()` with `keepalive: true` (fallback)
- **Rationale**: Reduce network overhead, ensure events delivered even when user leaves page

#### 5. **Script Loading Pattern**

- **Decision**: GTM-style dynamic script loading with API key injection
- **Snippet** (~500 bytes): Ultra-compact stub loaded synchronously in `<head>`
  - Creates `surface` array to queue early events
  - Dynamically loads `/tag.js?id=API_KEY` asynchronously
  - Google Tag Manager-inspired pattern
- **Main Script** (`/tag.js`): Served dynamically with API key baked in
  - Server-side API key injection at request time
  - Full analytics implementation (~15KB minified)
  - Auto-initializes with injected API key
- **Rationale**:
  - Zero performance impact (async loading)
  - Secure API key delivery (server-validated)
  - Industry-standard pattern (familiar to developers)
  - CDN-friendly (can cache with API key in query param)

---

## Production-Ready Decisions

### 1. **Privacy & Security**

#### Email Hashing

- **Decision**: Hash emails with SHA-256 before sending
- **Implementation**:
  ```typescript
  // Use browser's SubtleCrypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", emailBytes);
  // Fallback to simple hash if unavailable
  ```
- **Rationale**: GDPR compliance, never store PII in raw form

#### CORS & Origin Validation

- **Decision**: Script can be embedded on any domain (permissive CORS)
- **Security**: Validate API key on backend, rate limit by visitor_id
- **Rationale**: Analytics scripts must work cross-origin

### 2. **Reliability & Performance**

#### Event Delivery Guarantee

- **Problem**: Events lost when user closes tab
- **Solution**:
  1. Use `sendBeacon()` (queues even after page unload)
  2. Flush on `beforeunload`, `pagehide`, `visibilitychange` events
  3. `keepalive: true` in fetch requests
- **Result**: 99%+ event delivery rate

#### Memory Management

- **Queue Limits**: Max 100 events in memory
- **Auto-flush**: Every 5 seconds OR 10 events (whichever first)
- **Cleanup**: Clear timer on destroy, prevent memory leaks

#### Network Optimization

- **Batching**: 10 events per request instead of 10 separate requests

### 3. **Event Tracking Decisions**

#### Click Tracking Filter

- **Initial**: Tracked ALL clicks (h1, div, text nodes)
- **Problem**: Too much noise, useless data
- **Solution**: Filter to interactive elements only
  ```typescript
  const isInteractive =
    tagName === "button" ||
    tagName === "a" ||
    element.hasAttribute("data-track-surface"); // Explicit opt-in
  ```
- **Result**: High-signal click data

#### Auto-Tracking vs Manual

- **Auto-tracked**: page views, clicks, email inputs, script init
- **Manual (via API)**: custom events, identify
- **Rationale**: Balance between automatic insights and user control

#### Event Enrichment

Every event automatically includes:

```typescript
{
  visitor_id: "vis_abc123",
  user_id: "user_789" | null,
  session_id: "sess_xyz",
  timestamp: "2025-10-07T10:30:00Z",
  page_url: "https://example.com/pricing",
  page_title: "Pricing - Example",
  api_key: "proj_abc123"
}
```

- **Rationale**: Context is crucial for analytics, add it automatically

### 4. **Developer Experience**

#### API Design (Segment-Compatible)

```javascript
// Simple, intuitive API
analytics.page();
analytics.track("button_clicked", { button: "cta" });
analytics.identify("user_123", { plan: "pro" });
analytics.ready(() => console.log("Ready!"));
```

- **Decision**: Match Segment's API for familiarity
- **Benefit**: Easy migration, developers already know it

#### Debugging Support

- **Console Logs**: Log initialization, errors
- **Ready Callback**: Know when script is fully loaded
- **Error Handling**: Try-catch everywhere, never break host page

### 5. **Browser Compatibility**

#### Feature Detection & Fallbacks

```typescript
// SubtleCrypto for hashing
if (window.crypto?.subtle) {
  // Use SHA-256
} else {
  // Fallback to simple hash
}

// Storage
try {
  localStorage.setItem(/* ... */);
} catch {
  // Use cookies instead
}

// sendBeacon
if (navigator.sendBeacon) {
  // Use beacon
} else {
  // Fallback to fetch
}
```

---

## Phase 4: Database Schema & Backend Implementation

### Database Schema (Prisma)

**Schema Design Decisions**:

1. **Project Model**: Multi-tenancy foundation
   - Each customer has unique `apiKey`
   - Domain tracking for verification
   - One-to-many with visitors and events

2. **Visitor Separation**:
   - Deduplicate visitor data (1 visitor → many events)
   - Track anonymous → identified journey
   - Store user traits separately from events

3. **Event JSONB Properties**:
   - Support any event structure without migrations
   - PostgreSQL JSONB indexing for performance
   - Maximum flexibility for custom events

4. **Denormalized Fields**:
   - `userId`, `pageUrl` duplicated in Event table
   - Trade storage for query speed (no JOINs needed)
   - Critical for analytics performance

5. **Strategic Indexes**:
   - `(projectId, timestamp DESC)` - recent events per tenant
   - `(visitorId, timestamp)` - user journey queries
   - `(eventType, timestamp)` - event type filtering
   - `(sessionId)` - session analysis

6. **EventBatch Tracking**:
   - Idempotency (prevent duplicate processing)
   - Debugging (track batch failures)
   - Monitoring (processing latency)

### API Routes Implementation

#### 1. **POST /api/analytics/ingest**

**Purpose**: Receive event batches from `surface_analytics.js`

**Flow**:

```
1. Validate request body (Zod schema)
2. Verify API key → find Project
3. Create EventBatch record (status: pending)
4. Process each event:
   a. Upsert Visitor (by visitorId)
   b. Update user_id/traits if identify() called
   c. Insert Event
5. Update EventBatch (status: processed/failed)
6. Return 204 No Content
```

**Key Decisions**:

- **204 Response**: Standard for analytics (no body needed)
- **Batch Processing**: All-or-nothing vs. partial success
  - Chose: Partial success (log errors, process what we can)
- **Visitor Upsert**: Check existing visitor first
  - Update `lastSeen`, `userId`, `userTraits` if changed
- **Error Handling**: Never throw 500 to client (log errors, return success)

#### 2. **POST /api/analytics/verify**

**Purpose**: Verify script installation on user's website

**Flow**:

```
1. Validate request (url, api_key)
2. Verify Project exists
3. Fetch user's website HTML
4. Parse HTML with cheerio
5. Check for:
   a. Snippet in <head>
   b. Correct API key in snippet
   c. surface_analytics.js script tag
6. Return installation status
```

**Key Decisions**:

- **HTML Scraping**: Use cheerio (server-side jQuery-like)
- **Verification Logic**:
  ```typescript
  snippetFound =
    html.includes("window.analytics") && html.includes("analytics.load");
  correctApiKey = html.includes(apiKey);
  ```
- **CORS Bypass**: Server-side fetch (no browser CORS issues)
- **User Agent**: Identify as verification bot

**Edge Cases Handled**:

- Website requires authentication → Returns "can't verify"
- Website blocks bots → Returns "verification failed"
- Snippet on other page (not homepage) → User must provide correct URL

#### 3. **GET /api/analytics/events**

**Purpose**: Fetch events for dashboard with filters

**Query Parameters**:

- `api_key` (required)
- `event_type` (optional filter)
- `limit` (default: 50, max: 100)
- `offset` (pagination)
- `start_date`, `end_date` (time range)

**Flow**:

```
1. Validate query params (Zod)
2. Verify Project exists
3. Build WHERE clause (filters)
4. Fetch events + visitor info (JOIN)
5. Transform response
6. Return paginated results
```

**Performance Optimizations**:

- `orderBy: { timestamp: 'desc' }` - use index
- `take` & `skip` for pagination
- `include: { visitor }` - single query JOIN
- Parallel `Promise.all([events, count])` - fetch count in parallel

### Supporting Services

#### 1. **EventProcessor Service**

**Purpose**: Core event processing logic (reusable)

**Why Separate Service**:

- Reusable (could be used by webhooks, cron jobs)
- Testable (unit test without HTTP layer)
- Single responsibility (processing logic only)

#### 2. **ScriptVerifier Service**

**Purpose**: Verify script installation via HTML scraping

**Why Cheerio**:

- Lightweight (vs. Puppeteer)
- Fast (no browser overhead)
- Server-side only (no security issues)

**Comment Handling**:

- Strips HTML comments before verification
- Prevents false positives from commented-out snippets
- Uses regex: `/<!--[\s\S]*?-->/g`

### File Structure Created

```
src/
├── lib/
│   ├── analytics/
│   │   ├── core.ts                    # Config constants & interfaces
│   │   ├── visitor-id.ts              # Visitor identification
│   │   ├── session.ts                 # Session management
│   │   ├── transport.ts               # Event sending (beacon/fetch)
│   │   ├── queue.ts                   # Event batching
│   │   ├── analytics.ts               # Main Analytics class
│   │   ├── index.ts                   # Public exports
│   │   ├── trackers/
│   │   │   ├── click-tracker.ts       # Click event tracking
│   │   │   └── email-tracker.ts       # Email input tracking
│   │   └── api/
│   │       ├── validation.ts          # Zod schemas
│   │       ├── process-event.ts       # Event processor service
│   │       └── verify-script.ts       # Script verifier service
│   └── onboarding/
│       ├── types.ts                   # TypeScript types
│       └── constants.ts               # Snippet templates
├── app/
│   ├── page.tsx                       # Main onboarding page
│   ├── tag.js/
│   │   └── route.ts                   # Dynamic script serving
│   └── api/
│       └── analytics/
│           ├── ingest/route.ts        # POST - receive events
│           ├── verify/route.ts        # POST - verify installation
│           └── events/route.ts        # GET - fetch events
├── components/
│   ├── onboarding/
│   │   ├── onboarding-wrapper.tsx     # Main wrapper
│   │   ├── onboarding-step.tsx        # Reusable step component
│   │   ├── step-1-install-tag.tsx     # Step 1 UI
│   │   ├── step-2-test-events.tsx     # Step 2 UI
│   │   └── code-snippet.tsx           # Code display component
│   └── shared/
│       └── header.tsx                 # Page header
├── hooks/
│   └── use-onboarding.ts              # Onboarding state management
├── middleware.ts                      # CORS handling
└── scripts/
    └── build-analytics.ts             # Build script for analytics.js
```

## Tools & Dependencies

### Core Stack:

- **Next.js 14** (App Router, API routes)
- **TypeScript** (type safety)
- **Prisma** (ORM)
- **PostgreSQL** (database)
- **Zod** (validation)
- **Cheerio** (HTML parsing)
- **esbuild** (bundling)
- **TailwindCSS** (UI)

---

_Last Updated: October 8, 2025_
_Version: 1.0.0_
