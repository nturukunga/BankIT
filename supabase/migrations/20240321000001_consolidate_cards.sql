-- First, update the transactions table to remove the dependency
DO $$
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'transactions_card_id_fkey'
    ) THEN
        ALTER TABLE transactions
        DROP CONSTRAINT transactions_card_id_fkey;
    END IF;
END $$;

-- Create the new Card table
CREATE TABLE IF NOT EXISTS "Card" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES auth.users(id),
    "cardNumber" TEXT NOT NULL,
    "cardHolder" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    type TEXT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_card_user_id ON "Card"("userId");
CREATE INDEX IF NOT EXISTS idx_card_number ON "Card"("cardNumber");

-- Enable RLS
ALTER TABLE "Card" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own cards" ON "Card";
DROP POLICY IF EXISTS "Users can insert their own cards" ON "Card";
DROP POLICY IF EXISTS "Users can update their own cards" ON "Card";

CREATE POLICY "Users can view their own cards" 
    ON "Card" FOR SELECT 
    TO authenticated 
    USING ("userId" = auth.uid());

CREATE POLICY "Users can insert their own cards" 
    ON "Card" FOR INSERT 
    TO authenticated 
    WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own cards" 
    ON "Card" FOR UPDATE 
    TO authenticated 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Migrate data from old table
DO $$
BEGIN
    -- Only proceed if the old table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'cards'
    ) THEN
        -- Insert data from old table
        INSERT INTO "Card" (
            id,
            "userId",
            "cardNumber",
            "cardHolder",
            "expiryDate",
            type,
            "createdAt",
            "updatedAt"
        )
        SELECT
            id,  -- Keep the same ID to maintain relationships
            user_id,
            card_number,
            card_holder,
            expiry_date,
            type,
            created_at,
            updated_at
        FROM cards;

        -- Update transactions table to reference new Card table
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_card_id_fkey
        FOREIGN KEY (card_id) REFERENCES "Card"(id);

        -- Drop the old table
        DROP TABLE cards;
    END IF;
END $$; 