-- First, let's check the structure of the old table
DO $$
DECLARE
    old_table_exists boolean;
    column_names text[];
BEGIN
    -- Check if old table exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'cards'
    ) INTO old_table_exists;

    IF old_table_exists THEN
        -- Get column names from the old table
        SELECT array_agg(column_name::text)
        FROM information_schema.columns
        WHERE table_name = 'cards'
        INTO column_names;

        -- Log the column names for debugging
        RAISE NOTICE 'Existing columns in cards table: %', column_names;

        -- Drop the old table since we've captured its structure
        DROP TABLE IF EXISTS cards;
    END IF;
END $$;

-- Check if we need to migrate data
DO $$ 
BEGIN
    -- Only proceed if the old table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'cards'
    ) THEN
        -- Get the column names from the old table
        CREATE TEMP TABLE IF NOT EXISTS column_check AS
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'cards';

        -- Only proceed with migration if we have matching columns
        IF EXISTS (
            SELECT 1 FROM column_check 
            WHERE column_name IN ('number', 'holder', 'expiry', 'type', 'user_id')
        ) THEN
            -- Migrate data with proper column mapping
            INSERT INTO "Card" (
                id,
                user_id,
                card_number,
                card_holder,
                expiry_date,
                type,
                created_at,
                updated_at
            )
            SELECT
                gen_random_uuid(),
                user_id,
                number,
                holder,
                expiry,
                type,
                NOW(),
                NOW()
            FROM cards;

            -- Drop the old table
            DROP TABLE cards;
        END IF;

        -- Clean up temp table
        DROP TABLE IF EXISTS column_check;
    END IF;
END $$; 