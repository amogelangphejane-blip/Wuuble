-- Fix profile display names to use email username as fallback
-- Update existing profiles that have null display_name

-- First, let's update existing profiles that have null display_name
UPDATE public.profiles 
SET display_name = (
  SELECT SPLIT_PART(email, '@', 1) 
  FROM auth.users 
  WHERE auth.users.id = profiles.user_id
)
WHERE display_name IS NULL 
AND user_id IN (SELECT id FROM auth.users WHERE email IS NOT NULL);

-- Update the handle_new_user function to provide better fallbacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age, gender)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    CAST(NEW.raw_user_meta_data ->> 'age' AS INTEGER),
    NEW.raw_user_meta_data ->> 'gender'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;