ALTER TABLE "users"
  ADD COLUMN "show_watched_public" boolean NOT NULL DEFAULT true,
  ADD COLUMN "show_watchlist_public" boolean NOT NULL DEFAULT true;
