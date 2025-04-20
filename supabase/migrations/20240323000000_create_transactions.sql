-- Create Transaction table with proper camelCase columns
CREATE TABLE IF NOT EXISTS public."Transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "cardId" UUID NOT NULL REFERENCES public."Card"(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  description TEXT NOT NULL,
  category TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON public."Transaction"("userId");
CREATE INDEX IF NOT EXISTS idx_transaction_card_id ON public."Transaction"("cardId");
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON public."Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS idx_transaction_type ON public."Transaction"(type);

-- Enable RLS
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions" 
  ON public."Transaction" 
  FOR SELECT 
  USING ("userId" = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.transaction_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_transaction_updated_at
  BEFORE UPDATE ON public."Transaction"
  FOR EACH ROW
  EXECUTE PROCEDURE public.transaction_handle_updated_at();

-- Create function to handle transaction creation and balance update
CREATE OR REPLACE FUNCTION public.create_transaction(
  p_user_id UUID,
  p_card_id UUID,
  p_amount DECIMAL(10,2),
  p_type TEXT,
  p_description TEXT,
  p_category TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card RECORD;
  v_transaction_id UUID;
  v_new_balance DECIMAL(10,2);
  v_result JSONB;
BEGIN
  -- Check if card exists and belongs to user
  SELECT id, balance INTO v_card 
  FROM public."Card" 
  WHERE id = p_card_id AND "userId" = p_user_id;
  
  IF v_card.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Card not found or does not belong to user'
    );
  END IF;
  
  -- Calculate new balance based on transaction type
  CASE p_type
    WHEN 'deposit' THEN
      v_new_balance := v_card.balance + p_amount;
    WHEN 'withdrawal' THEN
      IF v_card.balance < p_amount THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Insufficient funds'
        );
      END IF;
      v_new_balance := v_card.balance - p_amount;
    WHEN 'transfer' THEN
      IF v_card.balance < p_amount THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Insufficient funds'
        );
      END IF;
      v_new_balance := v_card.balance - p_amount;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid transaction type'
      );
  END CASE;
  
  -- Start transaction
  BEGIN
    -- Create transaction record
    INSERT INTO public."Transaction" (
      "userId",
      "cardId",
      amount,
      type,
      description,
      category
    ) VALUES (
      p_user_id,
      p_card_id,
      p_amount,
      p_type,
      p_description,
      p_category
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update card balance
    UPDATE public."Card"
    SET balance = v_new_balance,
        "updatedAt" = NOW()
    WHERE id = p_card_id;
    
    -- Return success
    SELECT jsonb_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'new_balance', v_new_balance
    ) INTO v_result;
    
    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    -- Handle error
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;

-- Create Card table with proper column names matching the API
CREATE TABLE IF NOT EXISTS public."Card" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "cardNumber" TEXT NOT NULL,
  "cardHolder" TEXT NOT NULL,
  "expiryDate" TEXT NOT NULL,
  type TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_card_user_id ON public."Card"("userId");
CREATE INDEX IF NOT EXISTS idx_card_number ON public."Card"("cardNumber");

-- Enable RLS
ALTER TABLE public."Card" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cards" 
  ON public."Card" FOR SELECT 
  USING ("userId" = auth.uid());

CREATE POLICY "Users can insert their own cards" 
  ON public."Card" FOR INSERT 
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own cards" 
  ON public."Card" FOR UPDATE 
  USING ("userId" = auth.uid());

-- First check if UserSettings table exists
DROP TABLE IF EXISTS public."UserSettings";

-- Recreate UserSettings table with camelCase columns to match the API
CREATE TABLE IF NOT EXISTS public."UserSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  "darkMode" BOOLEAN NOT NULL DEFAULT true,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public."UserSettings"("userId");

-- Enable RLS
ALTER TABLE public."UserSettings" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" 
  ON public."UserSettings" 
  FOR SELECT 
  USING ("userId" = auth.uid());

CREATE POLICY "Users can update their own settings" 
  ON public."UserSettings" 
  FOR UPDATE 
  USING ("userId" = auth.uid());

CREATE POLICY "Users can insert their own settings" 
  ON public."UserSettings" 
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid()); 