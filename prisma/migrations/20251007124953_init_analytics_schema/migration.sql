-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "fingerprint" TEXT,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_traits" JSONB,
    "first_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL,
    "initial_referrer" TEXT,
    "initial_utm" JSONB,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "page_url" TEXT NOT NULL,
    "page_title" TEXT,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_batches" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "event_count" INTEGER NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,

    CONSTRAINT "event_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_api_key_key" ON "projects"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_visitor_id_key" ON "visitors"("visitor_id");

-- CreateIndex
CREATE INDEX "visitors_project_id_visitor_id_idx" ON "visitors"("project_id", "visitor_id");

-- CreateIndex
CREATE INDEX "visitors_project_id_user_id_idx" ON "visitors"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "visitors_project_id_last_seen_idx" ON "visitors"("project_id", "last_seen");

-- CreateIndex
CREATE INDEX "events_project_id_timestamp_idx" ON "events"("project_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "events_project_id_event_type_timestamp_idx" ON "events"("project_id", "event_type", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "events_visitor_id_timestamp_idx" ON "events"("visitor_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "events_session_id_timestamp_idx" ON "events"("session_id", "timestamp");

-- CreateIndex
CREATE INDEX "events_user_id_timestamp_idx" ON "events"("user_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "event_batches_batch_id_key" ON "event_batches"("batch_id");

-- CreateIndex
CREATE INDEX "event_batches_project_id_received_at_idx" ON "event_batches"("project_id", "received_at" DESC);

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
