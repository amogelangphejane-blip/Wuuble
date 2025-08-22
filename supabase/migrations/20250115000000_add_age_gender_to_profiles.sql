-- Add age and gender columns to profiles table for verification
ALTER TABLE public.profiles 
ADD COLUMN age INTEGER CHECK (age >= 13 AND age <= 120),
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));

-- Update the handle_new_user function to include age and gender
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age, gender)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'display_name',
    CAST(NEW.raw_user_meta_data ->> 'age' AS INTEGER),
    NEW.raw_user_meta_data ->> 'gender'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;