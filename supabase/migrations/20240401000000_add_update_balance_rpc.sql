-- Create function to update card balance 
-- This handles the balance update and transaction creation atomically
CREATE OR REPLACE FUNCTION public.update_card_balance(
  p_user_id UUID,
  p_card_id UUID,
  p_amount DECIMAL(10,2),
  p_type TEXT,
  p_description TEXT
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
  v_amount DECIMAL(10,2);
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
  
  -- Set actual amount change based on transaction type
  IF p_type = 'deposit' THEN
    v_amount := p_amount;
    v_new_balance := v_card.balance + p_amount;
  ELSIF p_type = 'withdrawal' THEN
    v_amount := p_amount * -1;
    
    -- Check if enough funds for withdrawal
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
  END IF;
  
  -- Start transaction
  BEGIN
    -- Create transaction record
    INSERT INTO public."Transaction" (
      "userId",
      "cardId",
      amount,
      type,
      description,
      "createdAt",
      "updatedAt"
    ) VALUES (
      p_user_id,
      p_card_id,
      v_amount,
      p_type,
      p_description,
      NOW(),
      NOW()
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