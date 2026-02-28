/*
  # Create projects table for design management

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `customer_name` (text) - Customer/client name
      - `site_name` (text) - Site/location name
      - `project_name` (text) - Optional project name
      - `devices` (jsonb) - Array of devices with positions and properties
      - `connections` (jsonb) - Array of connections between devices
      - `walls` (jsonb) - Array of wall/boundary lines
      - `bg_data_url` (text) - Background image data URL
      - `bg_opacity` (integer) - Background opacity percentage
      - `device_scale` (integer) - Device scale percentage
      - `device_opacity` (integer) - Device opacity percentage
      - `walls_opacity` (integer) - Walls opacity percentage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `projects` table
    - Add policy for public access (no auth required for now)

  3. Indexes
    - Index on customer_name for faster lookups
    - Index on updated_at for sorting
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  site_name text NOT NULL,
  project_name text,
  devices jsonb DEFAULT '[]'::jsonb,
  connections jsonb DEFAULT '[]'::jsonb,
  walls jsonb DEFAULT '[]'::jsonb,
  bg_data_url text,
  bg_opacity integer DEFAULT 60,
  device_scale integer DEFAULT 100,
  device_opacity integer DEFAULT 100,
  walls_opacity integer DEFAULT 90,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to projects"
  ON projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_name);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);

CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();