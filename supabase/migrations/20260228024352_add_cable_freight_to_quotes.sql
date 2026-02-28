/*
  # Add cable and freight fields to quotes

  1. Modified Tables
    - `quotes`
      - `cable_feet` (numeric, default 0) - Total cable run footage for labor calculation
      - `freight_cost` (numeric, default 0) - Freight charges for the quote

  2. Notes
    - These fields support Marshall Industries labor estimation standards
    - Cable labor is calculated at 8 hours per 1000 feet
    - Freight must be explicitly applied per the quoting checklist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'cable_feet'
  ) THEN
    ALTER TABLE quotes ADD COLUMN cable_feet numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'freight_cost'
  ) THEN
    ALTER TABLE quotes ADD COLUMN freight_cost numeric DEFAULT 0;
  END IF;
END $$;
