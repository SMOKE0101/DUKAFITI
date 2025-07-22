
-- Ensure debt_payments table exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debt_payments' 
    AND policyname = 'Users can view their own debt payments'
  ) THEN
    CREATE POLICY "Users can view their own debt payments" 
      ON public.debt_payments 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debt_payments' 
    AND policyname = 'Users can create their own debt payments'
  ) THEN
    CREATE POLICY "Users can create their own debt payments" 
      ON public.debt_payments 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debt_payments' 
    AND policyname = 'Users can update their own debt payments'
  ) THEN
    CREATE POLICY "Users can update their own debt payments" 
      ON public.debt_payments 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debt_payments' 
    AND policyname = 'Users can delete their own debt payments'
  ) THEN
    CREATE POLICY "Users can delete their own debt payments" 
      ON public.debt_payments 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON public.debt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer_id ON public.debt_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_timestamp ON public.debt_payments(timestamp);

-- Enable realtime for debt_payments table
ALTER TABLE public.debt_payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_payments;
