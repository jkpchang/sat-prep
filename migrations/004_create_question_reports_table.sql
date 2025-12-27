-- Create question_reports table
-- Allows users to report issues with questions
-- Users can insert reports and view their own reports (needed for .select() after insert)

CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  custom_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON question_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_reports_resolved ON question_reports(resolved) WHERE resolved = FALSE;

-- Enable Row Level Security
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone (including anonymous users) can report questions
-- user_id must match auth.uid() (exactly like private_leaderboards pattern)
-- Since we ensure a session exists before inserting, user_id is always set
CREATE POLICY "Anyone can report questions"
  ON question_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SELECT policy: Users can only view their own reports
-- This is needed for .select() after insert to work
-- Users cannot query all reports, only their own
CREATE POLICY "Users can view own reports"
  ON question_reports
  FOR SELECT
  USING (auth.uid() = user_id);

