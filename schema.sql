-- Supabase/PostgreSQL schema for the online release.
-- The browser demo does not connect to this database yet.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.historical_missions (
  mission_id text PRIMARY KEY,
  year integer NOT NULL,
  event_name text NOT NULL,
  start_datetime timestamptz,
  end_datetime timestamptz,
  cause text,
  storm_name text,
  confidence_level text NOT NULL CHECK (confidence_level IN ('verified','source_reported','pending')),
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.historical_sources (
  source_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id text NOT NULL REFERENCES public.historical_missions(mission_id),
  source_name text NOT NULL,
  source_date date,
  source_url text NOT NULL,
  confidence_level text NOT NULL CHECK (confidence_level IN ('verified','source_reported','pending')),
  retrieved_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.historical_records (
  record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id text NOT NULL REFERENCES public.historical_missions(mission_id),
  source_id uuid NOT NULL REFERENCES public.historical_sources(source_id),
  record_type text NOT NULL CHECK (record_type IN ('rainfall','water_level','river','district','subdistrict','village','population','households','agriculture_damage','road_damage','school_damage','hospital_damage','satellite_flood_extent','warning','response')),
  observed_at timestamptz,
  place_name text,
  value_numeric numeric,
  value_unit text,
  value_text text,
  geometry_geojson jsonb,
  confidence_level text NOT NULL CHECK (confidence_level IN ('verified','source_reported','pending')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX historical_records_mission_type ON public.historical_records(mission_id,record_type);

CREATE TABLE public.teacher_profiles (
  teacher_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.classrooms (
  classroom_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher_profiles(teacher_id) ON DELETE CASCADE,
  join_code text UNIQUE NOT NULL,
  mission_id text REFERENCES public.historical_missions(mission_id),
  time_limit_minutes integer CHECK (time_limit_minutes BETWEEN 5 AND 240),
  max_rounds integer NOT NULL DEFAULT 2 CHECK (max_rounds BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.players (
  player_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(classroom_id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('engineer','scientist','geographer','conservationist','rescuer')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.simulation_runs (
  run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(player_id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES public.historical_missions(mission_id),
  simulation_round integer NOT NULL CHECK (simulation_round BETWEEN 1 AND 4),
  budget_start integer NOT NULL,
  budget_used integer NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]',
  structures jsonb NOT NULL DEFAULT '[]',
  evacuation_actions jsonb NOT NULL DEFAULT '[]',
  warning_actions jsonb NOT NULL DEFAULT '[]',
  simulated_flood_extent jsonb,
  simulated_damage jsonb NOT NULL,
  score jsonb NOT NULL,
  reflection_answer jsonb,
  model_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id,mission_id,simulation_round)
);

ALTER TABLE public.historical_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY published_missions_read ON public.historical_missions FOR SELECT USING (published);
CREATE POLICY published_sources_read ON public.historical_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.historical_missions m WHERE m.mission_id=historical_sources.mission_id AND m.published)
);
CREATE POLICY published_records_read ON public.historical_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.historical_missions m WHERE m.mission_id=historical_records.mission_id AND m.published)
);
CREATE POLICY teacher_own_profile ON public.teacher_profiles FOR SELECT TO authenticated USING (teacher_id=auth.uid());
CREATE POLICY teacher_own_classrooms ON public.classrooms FOR ALL TO authenticated USING (teacher_id=auth.uid()) WITH CHECK (teacher_id=auth.uid());
CREATE POLICY teacher_own_players ON public.players FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.classrooms c WHERE c.classroom_id=players.classroom_id AND c.teacher_id=auth.uid())
);
CREATE POLICY teacher_own_runs ON public.simulation_runs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.players p JOIN public.classrooms c ON c.classroom_id=p.classroom_id WHERE p.player_id=simulation_runs.player_id AND c.teacher_id=auth.uid())
);
-- Students enroll and submit through a server route that validates the room code and session.
-- Never expose the service role key or allow anonymous direct INSERT into results tables.
-- Historical ingestion uses a trusted server identity; students and teachers cannot mutate facts.
