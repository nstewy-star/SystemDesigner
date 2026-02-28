/*
  # Create device_schematics table

  1. New Tables
    - `device_schematics`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `part` (text) - Device part number
      - `ports` (jsonb) - Custom port configuration
      - `schematic_image` (text) - Base64 encoded image or URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `device_schematics` table
    - Add policies for authenticated users to manage schematics for their projects

  3. Indexes
    - Add unique index on (project_id, part)
*/

CREATE TABLE IF NOT EXISTS device_schematics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  part text NOT NULL,
  ports jsonb NOT NULL DEFAULT '[]'::jsonb,
  schematic_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS device_schematics_project_part_idx
  ON device_schematics(project_id, part);

ALTER TABLE device_schematics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view device schematics for their projects"
  ON device_schematics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = device_schematics.project_id
    )
  );

CREATE POLICY "Users can insert device schematics for their projects"
  ON device_schematics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = device_schematics.project_id
    )
  );

CREATE POLICY "Users can update device schematics for their projects"
  ON device_schematics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = device_schematics.project_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = device_schematics.project_id
    )
  );

CREATE POLICY "Users can delete device schematics for their projects"
  ON device_schematics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = device_schematics.project_id
    )
  );
