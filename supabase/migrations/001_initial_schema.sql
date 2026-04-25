-- ================================================================
-- QUARTERS · Initial Schema
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------
CREATE TYPE user_role  AS ENUM ('viewer', 'worker', 'taskmaster');
CREATE TYPE zone_status AS ENUM (
  'idle', 'scheduled', 'in_progress', 'paused',
  'attention', 'completed', 'rework'
);

-- ----------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ----------------------------------------------------------------
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role   NOT NULL DEFAULT 'viewer',
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, display_name)
  VALUES (
    NEW.id,
    -- First user becomes taskmaster, rest are workers
    CASE WHEN (SELECT COUNT(*) FROM profiles) = 0 THEN 'taskmaster'::user_role ELSE 'worker'::user_role END,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------
-- ZONES (reference data — static apartment layout)
-- ----------------------------------------------------------------
CREATE TABLE zones (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  short_name TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  area       NUMERIC     NOT NULL,
  geometry   JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- OPERATION TYPES
-- ----------------------------------------------------------------
CREATE TABLE operation_types (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       TEXT        UNIQUE NOT NULL,
  label      TEXT        NOT NULL,
  sub_label  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- ZONE STATES (current state per zone — one row per zone)
-- ----------------------------------------------------------------
CREATE TABLE zone_states (
  zone_id              TEXT        PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
  status               zone_status NOT NULL DEFAULT 'idle',
  operation_type_id    UUID        REFERENCES operation_types(id) ON DELETE SET NULL,
  assigned_worker_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  notes                TEXT,
  started_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- ACTIVITY LOG (append-only history)
-- ----------------------------------------------------------------
CREATE TABLE activity_log (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id    TEXT        NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action     TEXT        NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------
CREATE INDEX idx_activity_zone      ON activity_log(zone_id);
CREATE INDEX idx_activity_created   ON activity_log(created_at DESC);
CREATE INDEX idx_zone_states_status ON zone_states(status);
CREATE INDEX idx_zone_states_worker ON zone_states(assigned_worker_id);

-- ----------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at   BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_zones_updated_at      BEFORE UPDATE ON zones       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_zone_states_updated_at BEFORE UPDATE ON zone_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_states    ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log   ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_tm"    ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taskmaster')
);

-- Zones (read-only reference)
CREATE POLICY "zones_select_all"      ON zones FOR SELECT USING (true);

-- Operation types
CREATE POLICY "ops_select_all"        ON operation_types FOR SELECT USING (true);
CREATE POLICY "ops_manage_tm"         ON operation_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taskmaster')
);

-- Zone states
CREATE POLICY "zone_states_select_all" ON zone_states FOR SELECT USING (true);
CREATE POLICY "zone_states_update_worker" ON zone_states FOR UPDATE USING (
  auth.uid() = assigned_worker_id
);
CREATE POLICY "zone_states_update_tm" ON zone_states FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taskmaster')
);

-- Activity log
CREATE POLICY "activity_select_all"   ON activity_log FOR SELECT USING (true);
CREATE POLICY "activity_insert_auth"  ON activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------
-- ENABLE REALTIME
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE zone_states;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
