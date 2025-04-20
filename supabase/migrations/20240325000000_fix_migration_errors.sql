-- First drop the existing function
DROP FUNCTION IF EXISTS public.create_transaction(uuid, uuid, numeric, text, text, text);

-- Then recreate the function with the correct return type
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

-- Drop existing policies from Card table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own cards" ON public."Card";
DROP POLICY IF EXISTS "Users can insert their own cards" ON public."Card";
DROP POLICY IF EXISTS "Users can update their own cards" ON public."Card";

-- Recreate policies
CREATE POLICY "Users can view their own cards" 
  ON public."Card" FOR SELECT 
  USING ("userId" = auth.uid());

CREATE POLICY "Users can insert their own cards" 
  ON public."Card" FOR INSERT 
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own cards" 
  ON public."Card" FOR UPDATE 
  USING ("userId" = auth.uid()); 