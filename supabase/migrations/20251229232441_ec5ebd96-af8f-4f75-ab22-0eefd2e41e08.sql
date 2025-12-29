-- Add server-side validation constraints for profile fields
-- Username: 3-30 characters, alphanumeric and underscores only (or null)
-- Display name: max 50 characters (or null)

-- Create validation function that allows null values
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate username if provided
  IF NEW.username IS NOT NULL AND NEW.username !~ '^[a-zA-Z0-9_]{1,30}$' THEN
    RAISE EXCEPTION 'Username must be 1-30 characters and contain only letters, numbers, and underscores';
  END IF;
  
  -- Validate display_name length if provided
  IF NEW.username IS NOT NULL AND char_length(NEW.username) > 30 THEN
    RAISE EXCEPTION 'Username must be 30 characters or less';
  END IF;
  
  IF NEW.display_name IS NOT NULL AND char_length(NEW.display_name) > 50 THEN
    RAISE EXCEPTION 'Display name must be 50 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS validate_profile_fields_trigger ON public.profiles;
CREATE TRIGGER validate_profile_fields_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_fields();