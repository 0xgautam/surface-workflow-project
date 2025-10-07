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

**Transition Strategy**: Separation of Concerns

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

# Output: public/surface_analytics.js (~15KB minified)
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
- **Compression**: Server uses gzip (handled by Next.js automatically)
- **Debouncing**: Some events (like scroll) would be debounced (not implemented yet)

### 3. **Event Tracking Decisions**

#### Click Tracking Filter

- **Initial**: Tracked ALL clicks (h1, div, text nodes)
- **Problem**: Too much noise, useless data
- **Solution**: Filter to interactive elements only
  ```typescript
  const isInteractive =
    tagName === "button" ||
    tagName === "a" ||
    element.hasAttribute("data-track"); // Explicit opt-in
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

#### Target: ES2017

- **Decision**: Compile to ES2017 (async/await supported)
- **Coverage**: 95%+ of browsers
- **Trade-off**: No IE11 support (acceptable in 2025)

---

## Phase 4: Backend Architecture (Upcoming)

### Planned API Routes

1. **`POST /api/analytics/ingest`**
   - Receive event batches from script
   - Validate API key
   - Upsert visitor, insert events
   - Return 204 (no content)

2. **`POST /api/analytics/verify-installation`**
   - Scrape user's website HTML
   - Check for snippet in `<head>` with correct API key
   - Return installation status

3. **`GET /api/analytics/events`**
   - Fetch recent events for dashboard
   - Filter by api_key, event_type, date range
   - Paginated results

### Database Schema (Prisma)

```prisma
model Visitor {
  id          String   @id @default(uuid())
  fingerprint String   @unique
  apiKey      String
  firstSeen   DateTime @default(now())
  lastSeen    DateTime @updatedAt
  metadata    Json?
  events      Event[]

  @@index([apiKey])
}

model Event {
  id         String   @id @default(uuid())
  visitorId  String
  visitor    Visitor  @relation(fields: [visitorId], references: [id])
  apiKey     String
  eventType  String
  eventName  String
  properties Json
  userId     String?
  sessionId  String
  pageUrl    String
  timestamp  DateTime @default(now())

  @@index([apiKey, timestamp])
  @@index([visitorId, timestamp])
  @@index([eventType, timestamp])
}
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
2. ⏳ Backend API routes (ingest, verify, events)
3. ⏳ Prisma schema + migrations
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

_Last Updated: October 7, 2025_
_Version: 1.0.0_
