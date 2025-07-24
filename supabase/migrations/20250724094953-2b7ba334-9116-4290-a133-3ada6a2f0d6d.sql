-- Create function to record debt payment and update customer balance atomically
CREATE OR REPLACE FUNCTION record_debt_payment_with_balance_update(
  p_user_id UUID,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_reference TEXT,
  p_timestamp TIMESTAMP WITH TIME ZONE,
  p_new_outstanding_debt DECIMAL,
  p_last_purchase_date TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
  -- Insert debt payment record
  INSERT INTO debt_payments (
    user_id,
    customer_id,
    customer_name,
    amount,
    payment_method,
    reference,
    timestamp,
    synced
  ) VALUES (
    p_user_id,
    p_customer_id,
    p_customer_name,
    p_amount,
    p_payment_method,
    p_reference,
    p_timestamp,
    true
  );

  -- Update customer outstanding debt if provided
  IF p_new_outstanding_debt IS NOT NULL THEN
    UPDATE customers 
    SET 
      outstanding_debt = p_new_outstanding_debt,
      last_purchase_date = COALESCE(p_last_purchase_date, last_purchase_date),
      updated_at = NOW()
    WHERE id = p_customer_id AND user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;