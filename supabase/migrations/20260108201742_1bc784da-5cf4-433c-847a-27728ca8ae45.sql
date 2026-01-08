-- Create a table for user's custom currency pairs
CREATE TABLE public.custom_currency_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pair TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pair)
);

-- Enable RLS
ALTER TABLE public.custom_currency_pairs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own custom pairs"
ON public.custom_currency_pairs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom pairs"
ON public.custom_currency_pairs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom pairs"
ON public.custom_currency_pairs
FOR DELETE
USING (auth.uid() = user_id);