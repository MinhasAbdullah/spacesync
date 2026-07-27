-- ==========================================
-- SpaceSync Database Schema & Extensions SQL
-- Tasks: Realtime, Check-in, Reminder Tracking
-- ==========================================

-- 1. Enable btree_gist extension for range exclusion constraint (Double-booking prevention)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Add Exclusion Constraint to prevent double-booking at DB level atomically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT no_overlapping_bookings 
    EXCLUDE USING gist (
      resource_id WITH =, 
      tsrange(start_time, end_time) WITH &&
    );
  END IF;
END $$;

-- 3. Ensure required columns for Check-in & Reminder workflows exist on bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_10m_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_released BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- 4. Enable Supabase Realtime for instant calendar slot updates (~1s updates across clients)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.bookings;
COMMIT;

-- 5. Performance Indexes for Cron Worker queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_24h 
  ON public.bookings (start_time, reminder_24h_sent, status);

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_10m 
  ON public.bookings (start_time, reminder_10m_sent, status);

CREATE INDEX IF NOT EXISTS idx_bookings_auto_release 
  ON public.bookings (start_time, checked_in, auto_released, status);
