/*
  # Add Quoting and Pricing System

  1. New Tables
    - `device_pricing`
      - `id` (uuid, primary key)
      - `part_number` (text, unique) - matches device part numbers in app
      - `unit_cost` (numeric) - dealer/cost price
      - `unit_price` (numeric) - sell price to customer
      - `labor_minutes` (integer) - installation time in minutes
      - `cable_type` (text, nullable) - associated cable type if applicable
      - `cable_cost_per_foot` (numeric) - cost of cable per foot
      - `created_at` / `updated_at` (timestamptz)

    - `quotes`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects) - links quote to a project
      - `quote_number` (text) - human-readable quote number
      - `status` (text) - draft/sent/accepted/rejected/expired
      - `labor_rate_per_hour` (numeric) - hourly labor rate
      - `markup_percent` (numeric) - markup on materials
      - `tax_percent` (numeric) - tax rate
      - `discount_percent` (numeric) - discount on total
      - `notes` (text) - general notes
      - `scope_of_work` (text) - scope of work description
      - `valid_until` (date, nullable) - quote expiry date
      - `subtotal_materials` (numeric) - calculated subtotal for materials
      - `subtotal_labor` (numeric) - calculated subtotal for labor
      - `total` (numeric) - final total
      - `created_at` / `updated_at` (timestamptz)

    - `quote_line_items`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, FK to quotes)
      - `part_number` (text) - device part number
      - `description` (text) - line item description
      - `category` (text) - SOW category grouping
      - `quantity` (integer)
      - `unit_cost` (numeric) - cost at time of quote
      - `unit_price` (numeric) - sell price at time of quote
      - `labor_minutes` (integer) - labor for this line
      - `cable_length_feet` (numeric) - cable length if applicable
      - `cable_cost` (numeric) - total cable cost for this line
      - `line_total` (numeric) - quantity * unit_price
      - `sort_order` (integer) - display order
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for public access (no auth yet - will add later)

  3. Notes
    - device_pricing stores the pricing catalog independent of any project
    - quotes are linked to projects and contain snapshot pricing
    - quote_line_items store the breakdown with prices locked at quote time
*/

CREATE TABLE IF NOT EXISTS device_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text UNIQUE NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  labor_minutes integer NOT NULL DEFAULT 0,
  cable_type text,
  cable_cost_per_foot numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE device_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to device pricing"
  ON device_pricing FOR SELECT
  TO public
  USING (part_number IS NOT NULL);

CREATE POLICY "Allow insert to device pricing"
  ON device_pricing FOR INSERT
  TO public
  WITH CHECK (part_number IS NOT NULL);

CREATE POLICY "Allow update to device pricing"
  ON device_pricing FOR UPDATE
  TO public
  USING (part_number IS NOT NULL)
  WITH CHECK (part_number IS NOT NULL);

CREATE POLICY "Allow delete from device pricing"
  ON device_pricing FOR DELETE
  TO public
  USING (part_number IS NOT NULL);

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  quote_number text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft', 'sent', 'accepted', 'rejected', 'expired'])),
  labor_rate_per_hour numeric NOT NULL DEFAULT 85,
  markup_percent numeric NOT NULL DEFAULT 0,
  tax_percent numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  scope_of_work text DEFAULT '',
  valid_until date,
  subtotal_materials numeric NOT NULL DEFAULT 0,
  subtotal_labor numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to quotes"
  ON quotes FOR SELECT
  TO public
  USING (project_id IS NOT NULL);

CREATE POLICY "Allow insert to quotes"
  ON quotes FOR INSERT
  TO public
  WITH CHECK (project_id IS NOT NULL);

CREATE POLICY "Allow update to quotes"
  ON quotes FOR UPDATE
  TO public
  USING (project_id IS NOT NULL)
  WITH CHECK (project_id IS NOT NULL);

CREATE POLICY "Allow delete from quotes"
  ON quotes FOR DELETE
  TO public
  USING (project_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  part_number text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  labor_minutes integer NOT NULL DEFAULT 0,
  cable_length_feet numeric NOT NULL DEFAULT 0,
  cable_cost numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to quote line items"
  ON quote_line_items FOR SELECT
  TO public
  USING (quote_id IS NOT NULL);

CREATE POLICY "Allow insert to quote line items"
  ON quote_line_items FOR INSERT
  TO public
  WITH CHECK (quote_id IS NOT NULL);

CREATE POLICY "Allow update to quote line items"
  ON quote_line_items FOR UPDATE
  TO public
  USING (quote_id IS NOT NULL)
  WITH CHECK (quote_id IS NOT NULL);

CREATE POLICY "Allow delete from quote line items"
  ON quote_line_items FOR DELETE
  TO public
  USING (quote_id IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_type text DEFAULT 'new-r5k';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'floorplan_scale'
  ) THEN
    ALTER TABLE projects ADD COLUMN floorplan_scale numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'show_device_names'
  ) THEN
    ALTER TABLE projects ADD COLUMN show_device_names boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'show_ports'
  ) THEN
    ALTER TABLE projects ADD COLUMN show_ports boolean DEFAULT true;
  END IF;
END $$;