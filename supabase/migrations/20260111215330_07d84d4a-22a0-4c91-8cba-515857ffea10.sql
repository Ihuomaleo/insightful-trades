-- Fix 1: Update handle_new_user() to validate display_name input
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Extract and validate display_name
  display_name_value := TRIM(new.raw_user_meta_data ->> 'display_name');
  
  -- Handle NULL values
  IF display_name_value IS NULL OR display_name_value = '' THEN
    display_name_value := NULL;
  -- Limit length to reasonable value (100 chars)
  ELSIF LENGTH(display_name_value) > 100 THEN
    display_name_value := SUBSTRING(display_name_value, 1, 100);
  END IF;
  
  -- Insert with validated value
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, display_name_value);
  
  RETURN new;
END;
$$;

-- Fix 2: Add CHECK constraint on custom_currency_pairs for server-side validation
-- Validates pair format matches CLIENT-SIDE regex: ^[A-Z]{2,5}/[A-Z]{2,5}$
ALTER TABLE public.custom_currency_pairs
ADD CONSTRAINT valid_pair_format 
CHECK (pair ~ '^[A-Z]{2,5}/[A-Z]{2,5}$');

-- Also add a reasonable max length constraint
ALTER TABLE public.custom_currency_pairs
ADD CONSTRAINT pair_max_length
CHECK (LENGTH(pair) <= 11);

-- Add CHECK constraint on profiles.display_name for defense-in-depth
ALTER TABLE public.profiles
ADD CONSTRAINT display_name_max_length
CHECK (display_name IS NULL OR LENGTH(display_name) <= 100);