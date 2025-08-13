-- Migration: Fix Stripe URL Schema
-- Change from complex JSONB object to simple VARCHAR string
-- Following the same pattern as the working Links table

-- Step 1: Add the new simple stripe_url column
ALTER TABLE booster_clubs 
ADD COLUMN stripe_url VARCHAR(500);

-- Step 2: Migrate existing data from JSONB to simple string
-- Extract the 'payment' URL from existing stripe_urls JSONB data
UPDATE booster_clubs 
SET stripe_url = (
    CASE 
        WHEN stripe_urls IS NOT NULL AND stripe_urls::text != 'null' 
        THEN (stripe_urls->>'payment')::VARCHAR(500)
        ELSE NULL
    END
)
WHERE stripe_urls IS NOT NULL;

-- Step 3: Drop the old complex JSONB column
ALTER TABLE booster_clubs 
DROP COLUMN stripe_urls;

-- Step 4: Add an index for better performance (following Links table pattern)
CREATE INDEX IF NOT EXISTS idx_booster_clubs_stripe_url ON booster_clubs(stripe_url);

-- Verify the migration
SELECT 
    id, 
    name, 
    zelle_url, 
    stripe_url, 
    is_payment_enabled 
FROM booster_clubs 
WHERE stripe_url IS NOT NULL 
LIMIT 5;
