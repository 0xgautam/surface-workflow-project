# Surface Analytics - Full-Stack Analytics Platform

A Segment-like analytics tracking system built with the T3 Stack. This project includes a client-side JavaScript tracking script, backend API for event ingestion, and a dashboard for viewing events in real-time.

## Features

✅ **Client-Side Analytics Script** (`surface_analytics.js`)

- Modular TypeScript architecture
- GTM-style dynamic script loading
- Auto-tracking (page views, clicks, email inputs)
- Event batching & reliable transport (sendBeacon)
- Privacy-first (email hashing, GDPR compliant)

✅ **Backend API**

- Dynamic script serving (`/tag.js`) with API key injection
- Event ingestion endpoint (`/api/analytics/ingest`)
- Script verification (`/api/analytics/verify`)
- Event fetching with filters (`/api/analytics/events`)

✅ **Onboarding Dashboard**

- Two-step onboarding flow
- Real-time event polling
- Script verification with detailed feedback
- Responsive design (mobile-first)
- Collapsible steps with Framer Motion animations

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (Serverless), Prisma ORM
- **Database**: PostgreSQL
- **Analytics**: Custom JavaScript tracking library
- **UI**: Framer Motion, Heroicons, shadcn/ui components
- **Validation**: Zod
- **Build Tools**: esbuild, TypeScript

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for local PostgreSQL)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Database

```bash
./start-database.sh
# Say yes for the random password
```

### 3. Setup Database Schema

```bash
# Run migrations
pnpm prisma migrate dev

# Or push schema directly
pnpm db:push

# (Optional) Seed with test data
pnpm db:seed
```

### 4. Build Analytics Script

```bash
pnpm build:analytics
```

This compiles the TypeScript analytics modules into a minified JavaScript bundle (`public/surface_analytics.js`).

### 5. Start Development Servers

You need **two terminals** for full testing:

#### Terminal 1: Main Application (Port 3000)

```bash
pnpm dev
```

This runs the onboarding dashboard at `http://localhost:3000`

#### Terminal 2: Test Customer Website (Port 3001)

```bash
pnpm dev
```

NextJs will detech port 3000 is busy and run this in port 3001. You can access `test-analytics.html` at `http://localhost:3001/test-analytics.html` to test.

---

## Testing Workflow

### Complete End-to-End Test

1. **Open Onboarding Dashboard**
   - Navigate to `http://localhost:3000`
   - You'll see the two-step onboarding flow

2. **Step 1: Install Tag**
   - Copy the JavaScript snippet shown
   - Paste it into `public/test-analytics.html` in the `<head>` tag
   - Click "Test Connection" to verify installation
   - The system will scrape your test site and verify the snippet is present

3. **Step 2: Test Events**
   - Once verified, click "Next Step"
   - Open `http://localhost:3001/test-analytics.html` in another tab
   - Interact with the test page (click buttons, enter email, etc.)
   - Return to the dashboard
   - Click "Test Tag" or wait for auto-polling (3 seconds)
   - Events should appear in the table in real-time

### Simulated Customer Website

The `public/test-analytics.html` file simulates a customer's website with:

- Click tracking test buttons
- Email input form
- Custom event triggers
- User identification demo
- SPA navigation simulation

---

## Project Structure

```
surface-workflow-project/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Onboarding dashboard
│   │   ├── layout.tsx                  # Root layout with sidebar
│   │   ├── tag.js/route.ts             # Dynamic script serving
│   │   └── api/analytics/
│   │       ├── ingest/route.ts         # Event ingestion
│   │       ├── verify/route.ts         # Script verification
│   │       └── events/route.ts         # Fetch events
│   ├── components/
│   │   ├── onboarding/                 # Onboarding flow components
│   │   ├── shared/                     # Header, etc.
│   │   └── ui/                         # shadcn/ui components
│   ├── hooks/
│   │   └── use-onboarding.ts           # Onboarding state management
│   ├── lib/
│   │   ├── analytics/                  # Client-side analytics modules
│   │   │   ├── core.ts
│   │   │   ├── visitor-id.ts
│   │   │   ├── session.ts
│   │   │   ├── transport.ts
│   │   │   ├── queue.ts
│   │   │   ├── analytics.ts
│   │   │   └── trackers/
│   │   │       ├── click-tracker.ts
│   │   │       └── email-tracker.ts
│   │   └── onboarding/
│   │       ├── types.ts
│   │       └── constants.ts
│   └── server/
│       └── db.ts                       # Prisma client
├── prisma/
│   ├── schema.prisma                   # Database schema
│   ├── seed.ts                         # Seed script
│   └── migrations/                     # Migration history
├── scripts/
│   └── build-analytics.ts              # Analytics script build
├── public/
│   ├── surface_analytics.js            # Built analytics script
│   ├── test-analytics.html             # Test customer website
│   └── snippet.html                    # Snippet template
└── diary.md                            # Development diary
```

---

## Available Scripts

### Development

```bash
pnpm dev                # Start Next.js dev server (port 3000)
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
```

### Database

```bash
pnpm db:push            # Push schema to database
pnpm db:migrate         # Run migrations
pnpm db:studio          # Open Prisma Studio
pnpm db:seed            # Seed database with test data
pnpm db:reset           # Reset database
```

### Analytics Script

```bash
pnpm build:analytics    # Build analytics JavaScript bundle
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/surface-analytics"

# App
NODE_ENV="development"
```

---

## API Endpoints

### Analytics Script

- `GET /tag.js?id=<API_KEY>` - Dynamically serves analytics script with injected API key

### Analytics API

- `POST /api/analytics/ingest` - Receive event batches from client script
- `POST /api/analytics/verify` - Verify script installation on customer website
- `GET /api/analytics/events` - Fetch events with filters (query params: `api_key`, `limit`, `offset`)

---

## Database Schema

### Models

- **Project** - Represents a customer (multi-tenant design)
- **Visitor** - Anonymous or identified user on tracked website
- **Event** - Individual tracking events with JSONB properties
- **EventBatch** - Batch tracking for idempotency and debugging

### Key Features

- Multi-tenant isolation via `apiKey`
- Two-tier visitor identification (`visitor_id` → `user_id`)
- Flexible JSONB event properties
- Strategic indexes for performance
- Denormalized fields for fast queries

---

## Deployment

### Build for Production

```bash
pnpm build
```

### Deploy to Vercel

```bash
vercel deploy
```

### Environment Variables (Production)

Set these in your Vercel dashboard:

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production`

---

## Testing Checklist

- [ ] Analytics script builds successfully (`pnpm build:analytics`)
- [ ] Database migrated (`pnpm db:push`)
- [ ] Both servers running (3000 and 3001)
- [ ] Onboarding dashboard loads
- [ ] Script verification works
- [ ] Events are tracked and displayed
- [ ] Real-time polling updates table
- [ ] Mobile responsive design works
- [ ] Sidebar converts to sheet on mobile

---

## Documentation

- [Development Diary](./diary.md) - Detailed development decisions and architecture
- [PRD](./PRD.md) - Original project requirements
- [Prisma Schema](./prisma/schema.prisma) - Database schema definition

---

## Learn More

### T3 Stack Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org/docs)

### Analytics Inspiration

- [Segment Spec](https://segment.com/docs/connections/spec/)
- [Amplitude Analytics](https://www.docs.developers.amplitude.com/)
- [Google Analytics](https://developers.google.com/analytics)

---

## License

MIT

---

## Credits

Built as part of the Surface Labs take-home assessment.
