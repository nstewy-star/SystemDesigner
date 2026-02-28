/*
  # Add Floor Plans Support to Projects

  1. Modified Tables
    - `projects`
      - `floor_plans` (jsonb, default '[]') - Array of floor plan objects with id, name, imageUrl, opacity
      - `active_floor_plan_id` (text, nullable) - ID of the currently active floor plan

  2. Notes
    - Existing projects with background_image_url will NOT be auto-migrated; the app handles backward compat
    - Floor plans are stored as JSONB array for flexibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'floor_plans'
  ) THEN
    ALTER TABLE projects ADD COLUMN floor_plans jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'active_floor_plan_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN active_floor_plan_id text;
  END IF;
END $$;
