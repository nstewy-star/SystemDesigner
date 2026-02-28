/*
  # Create kits table for nurse call system

  1. New Tables
    - `kits`
      - `id` (uuid, primary key) - Unique identifier for each kit
      - `name` (text) - Name of the kit (e.g., "Standard Room", "ICU Room")
      - `parts` (jsonb) - Array of device part numbers included in the kit
      - `created_at` (timestamptz) - When the kit was created
      - `updated_at` (timestamptz) - When the kit was last updated

  2. Security
    - Enable RLS on `kits` table
    - Add policy for public read access (since this is a local tool, kits are shared)
    - Add policy for public write access
*/

CREATE TABLE IF NOT EXISTS kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read kits (for a single-user/team application)
CREATE POLICY "Anyone can read kits"
  ON kits
  FOR SELECT
  USING (true);

-- Allow anyone to insert kits
CREATE POLICY "Anyone can insert kits"
  ON kits
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update kits
CREATE POLICY "Anyone can update kits"
  ON kits
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete kits
CREATE POLICY "Anyone can delete kits"
  ON kits
  FOR DELETE
  USING (true);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS kits_created_at_idx ON kits(created_at DESC);