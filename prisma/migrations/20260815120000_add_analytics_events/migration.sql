CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "eventName" TEXT NOT NULL DEFAULT 'page_view',
    "path" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT,
    "referrer" TEXT,
    "referrerHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "visitorHash" TEXT,
    "sessionHash" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_site_createdAt_idx" ON "AnalyticsEvent"("site", "createdAt");
CREATE INDEX "AnalyticsEvent_eventName_createdAt_idx" ON "AnalyticsEvent"("eventName", "createdAt");
CREATE INDEX "AnalyticsEvent_visitorHash_createdAt_idx" ON "AnalyticsEvent"("visitorHash", "createdAt");
CREATE INDEX "AnalyticsEvent_path_createdAt_idx" ON "AnalyticsEvent"("path", "createdAt");
