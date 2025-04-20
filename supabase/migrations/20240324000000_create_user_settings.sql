-- Create UserSettings table
CREATE TABLE IF NOT EXISTS public."UserSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rename column for consistency with API and Prisma
COMMENT ON COLUMN public."UserSettings".user_id IS 'Will be referenced as userId in the API';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public."UserSettings"(user_id);

-- Enable Row Level Security
ALTER TABLE public."UserSettings" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" 
  ON public."UserSettings" 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" 
  ON public."UserSettings" 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" 
  ON public."UserSettings" 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.user_settings_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public."UserSettings"
  FOR EACH ROW
  EXECUTE PROCEDURE public.user_settings_handle_updated_at(); 