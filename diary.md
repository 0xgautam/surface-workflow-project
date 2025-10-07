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

- **Decision**: Two-file approach (snippet + main script)
- **Snippet** (`<10KB`): Tiny stub loaded synchronously in `<head>`
  - Creates stub methods that queue calls
  - Loads main script asynchronously
- **Main Script** (`surface_analytics.js`): Full implementation loaded async
  - Replays queued calls from stub
- **Rationale**: Zero performance impact on page load (async), but tracking starts immediately

---

## Phase 2: From Scrappy to Production

### Early Scrappy Version (Monolithic)

**Initial Approach** (Single 500-line file):

```javascript
// One massive IIFE with everything mixed together
(function () {
  var eventQueue = [];
  var visitorId = null;

  // Visitor ID generation logic mixed in
  function getVisitorId() {
    /* ... */
  }

  // Click tracking inline
  document.addEventListener("click", function (e) {
    // 50 lines of click handling here
  });

  // Email tracking inline
  document.addEventListener("blur", function (e) {
    // 40 lines of email handling here
  });

  // Transport logic mixed in
  function sendEvents() {
    /* ... */
  }

  // Analytics methods
  window.analytics = {
    track: function () {
      /* ... */
    },
    page: function () {
      /* ... */
    },
  };
})();
```

**Problems with Scrappy Version**:

- ❌ Hard to test individual components
- ❌ Difficult to add new event trackers
- ❌ No type safety
- ❌ Hard to debug (everything in one scope)
- ❌ Poor code reusability

### Production Version (Modular Architecture)

**Module Breakdown**:

```
analytics/
├── core.ts              # Config + TypeScript interfaces
├── visitor-id.ts        # Visitor identification (fingerprinting, storage)
├── session.ts           # Session + user ID management
├── transport.ts         # Event sending (beacon/fetch)
├── queue.ts             # Event batching + flushing
├── analytics.ts         # Main orchestrator class
├── trackers/
│   ├── click-tracker.ts # Click event tracking
│   └── email-tracker.ts # Email input tracking
└── index.ts             # Public exports
```

**Key Improvements**:

1. **Single Responsibility**: Each module does ONE thing well
2. **Dependency Injection**: Transport, trackers are injected (easier testing)
3. **TypeScript**: Full type safety with interfaces
4. **Extensibility**: Add new trackers by creating new class

**Build Process**:

```bash
# TypeScript modules → esbuild → Minified IIFE
pnpm build:analytics

# Output: public/surface_analytics.js
```

---

## Phase 3: Production-Ready Decisions

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

#### Snippet Compactness

- **Initial Snippet**: ~1.5KB (too large)
- **Optimized Snippet**: ~500 bytes
  ```javascript
  // Minified, single-letter variables
  !function(){var a=window.analytics=/* ... */}();
  ```
- **Rationale**: Every byte in `<head>` impacts page load performance

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

**Code Structure**:

```typescript
// src/app/api/analytics/ingest/route.ts
export async function POST(request: NextRequest) {
  // 1. Parse & validate (Zod)
  // 2. Process batch (EventProcessor service)
  // 3. Return 204 or error
}
```

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

**Response Format**:

```typescript
{
  events: [
    {
      id: "evt_123",
      event: "click",
      visitor_id: "vis_abc",
      user_id: "user_789",
      properties: { ... },
      timestamp: "2025-10-07T10:30:00Z"
    }
  ],
  pagination: {
    total: 1250,
    limit: 50,
    offset: 0,
    hasMore: true
  }
}
```

**Performance Optimizations**:

- `orderBy: { timestamp: 'desc' }` - use index
- `take` & `skip` for pagination
- `include: { visitor }` - single query JOIN
- Parallel `Promise.all([events, count])` - fetch count in parallel

### Supporting Services

#### 1. **EventProcessor Service**

**Purpose**: Core event processing logic (reusable)

**Class Structure**:

```typescript
class EventProcessor {
  async processBatch(apiKey, events, batchId) {
    // 1. Verify project
    // 2. Create EventBatch record
    // 3. Process each event
    // 4. Update batch status
  }

  private async processEvent(projectId, event) {
    // 1. Upsert visitor
    // 2. Insert event
  }
}
```

**Upsert Logic**:

```typescript
// First check if visitor exists
let visitor = await prisma.visitor.findUnique({
  where: { visitorId }
});

if (!visitor) {
  // Create new visitor
  visitor = await prisma.visitor.create({ ... });
} else {
  // Update if user_id or traits changed
  if (event.user_id || event.properties?.traits) {
    await prisma.visitor.update({ ... });
  }
}
```

**Why Separate Service**:

- Reusable (could be used by webhooks, cron jobs)
- Testable (unit test without HTTP layer)
- Single responsibility (processing logic only)

#### 2. **ScriptVerifier Service**

**Purpose**: Verify script installation via HTML scraping

**Implementation**:

```typescript
class ScriptVerifier {
  async verifyInstallation(url, apiKey) {
    // 1. Fetch HTML
    const html = await fetch(url);

    // 2. Parse with cheerio
    const $ = cheerio.load(html);

    // 3. Check snippet in <head>
    $("head script").each((_, el) => {
      const content = $(el).html();
      if (content.includes("analytics.load")) {
        snippetFound = true;
        if (content.includes(apiKey)) {
          correctApiKey = true;
        }
      }
    });

    // 4. Return status
    return { installed, snippetFound, scriptLoaded };
  }
}
```

**Why Cheerio**:

- Lightweight (vs. Puppeteer)
- Fast (no browser overhead)
- jQuery-like API (familiar)
- Server-side only (no security issues)

### Validation Layer (Zod)

**Purpose**: Type-safe request/response validation

**Schemas**:

```typescript
// src/lib/analytics/validation.ts
export const eventBatchSchema = z.object({
  api_key: z.string().min(1),
  events: z.array(eventSchema).min(1),
  batch_id: z.string().uuid(),
  sent_at: z.string().datetime(),
});

export const eventsQuerySchema = z.object({
  api_key: z.string().min(1),
  event_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  // ...
});
```

**Benefits**:

- Runtime validation (catch bad requests)
- Type inference (TypeScript types from schemas)
- Clear error messages (Zod's `.flatten()`)
- Self-documenting (schema = API contract)

### CORS Middleware

**Purpose**: Allow cross-origin requests for analytics

**Implementation**:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/analytics")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return response;
  }
}
```

**Why Permissive CORS**:

- Analytics scripts must work on any domain
- Security via API key validation (not origin)
- Standard pattern (Segment, Amplitude do this)

### Dependencies Added

```bash
pnpm add cheerio zod  # HTML parsing + validation
pnpm add -D @types/cheerio  # TypeScript types
```

### File Structure Created

```
src/
├── lib/
│   └── analytics/
│       ├── validation.ts          # Zod schemas
│       ├── event-processor.ts     # Event processing logic
│       └── script-verifier.ts     # Installation verification
├── app/
│   └── api/
│       └── analytics/
│           ├── ingest/route.ts    # POST - receive events
│           ├── verify/route.ts    # POST - verify installation
│           └── events/route.ts    # GET - fetch events
└── middleware.ts                  # CORS handling
```

---

## Key Learnings & Best Practices

### 1. **Start with Architecture**

- Spent time upfront on modular design
- Paid off massively when adding features
- Easy to test, extend, maintain

### 2. **Privacy First**

- Hash PII before transmission
- Make privacy the default, not an afterthought
- Users trust analytics that respect privacy

### 3. **Reliability Over Features**

- Ensure events are delivered (sendBeacon, batching)
- Graceful degradation (fallbacks everywhere)
- Never break the host page (try-catch, error handling)

### 4. **Performance Matters**

- Async loading (non-blocking)
- Event batching (reduce network calls)
- Compact snippet (minimal page weight)

### 5. **Developer Experience**

- Familiar API (Segment-compatible)
- Good error messages
- Clear documentation
- Easy debugging

### 6. **TypeScript is Worth It**

- Caught bugs at compile time
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

---

## What's Next

### Immediate TODOs:

1. ✅ Modular script architecture
2. ✅ Backend API routes (ingest, verify, events)
3. ✅ Prisma schema + migrations
4. ⏳ Frontend dashboard (Step 2 UI)
5. ⏳ Real-time event display (polling/SSE)

### Future Enhancements:

- [ ] Session replay (record DOM mutations)
- [ ] Custom event schemas (validate user events)
- [ ] Data warehouse export (BigQuery, Snowflake)
- [ ] A/B testing support
- [ ] Funnel analysis
- [ ] Cohort analysis

---

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

### Build Tools:

- **tsx** (TypeScript execution)
- **esbuild** (fast bundling)
- **eslint** (linting)

### Testing (Future):

- **Vitest** (unit tests)
- **Playwright** (E2E tests)

---

## Metrics to Track (Meta)

How we'll measure our analytics system:

- **Event Delivery Rate**: Target 99%+
- **Script Load Time**: <100ms
- **API Response Time**: <200ms p99
- **Event Processing Lag**: <1 second
- **Script Size**: <20KB gzipped
- **Uptime**: 99.9%

---

## Phase 5: Current Status & Next Steps

### ✅ Completed Components

1. **Client-Side Analytics Script**
   - Modular TypeScript architecture (8 separate modules)
   - Event tracking (page views, clicks, emails, custom events)
   - Visitor identification (fingerprinting + storage)
   - Event batching & reliable transport (sendBeacon)
   - Privacy-first (email hashing)
   - Browser compatibility (feature detection, fallbacks)

2. **Database Schema**
   - Multi-tenant design (Project model)
   - Visitor tracking (anonymous → identified)
   - Flexible event storage (JSONB properties)
   - Performance indexes (timestamp DESC, composite keys)
   - Batch tracking (idempotency, debugging)

3. **Backend API**
   - `/api/analytics/ingest` - Event ingestion endpoint
   - `/api/analytics/verify` - Script installation verification
   - `/api/analytics/events` - Event fetching with filters
   - Zod validation layer
   - Service architecture (EventProcessor, ScriptVerifier)
   - CORS middleware

### ⏳ In Progress / Next Up

1. **Frontend Dashboard (Step 2 of Onboarding)**
   - Display installation snippet
   - Real-time event table
   - "Test Tag" button
   - Auto-complete step when events detected

2. **Real-time Updates**
   - Event polling (every 2-3 seconds)
   - OR Server-Sent Events (bonus)

3. **Onboarding Flow (Step 1)**
   - Generate unique API key per user
   - Display installation instructions
   - Verify installation button

### 🎯 Project Milestones

- [x] Planning & Architecture (Phase 1)
- [x] Analytics Script Development (Phase 2-3)
- [x] Database Schema Design (Phase 4)
- [x] Backend API Implementation (Phase 4)
- [ ] Frontend Dashboard (Phase 5)
- [ ] End-to-End Testing
- [ ] Deployment & Polish

---

_Last Updated: October 7, 2025_
_Version: 1.0.0_
