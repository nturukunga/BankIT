-- Completely disable Row Level Security on User table temporarily
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow anyone to create users" ON "User";
DROP POLICY IF EXISTS "Users can view their own data" ON "User";
DROP POLICY IF EXISTS "Users can update their own data" ON "User";
DROP POLICY IF EXISTS "Service role can do everything" ON "User";

-- Create proper RLS policies for User table
CREATE POLICY "Public read access to User" 
ON "User" FOR SELECT 
TO PUBLIC
USING (true);

CREATE POLICY "Auth users can insert users" 
ON "User" FOR INSERT 
TO PUBLIC
WITH CHECK (true);

CREATE POLICY "Users can update own data" 
ON "User" FOR UPDATE 
USING (auth.uid()::text = id OR auth.role() = 'service_role')
WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own data" 
ON "User" FOR DELETE 
USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- Enable Row Level Security with the new policies
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Create additional triggers and functions if needed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, emailVerified, createdAt, updatedAt)
  VALUES (new.id, new.email, 
         COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
         CURRENT_TIMESTAMP,
         CURRENT_TIMESTAMP,
         CURRENT_TIMESTAMP);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create User record when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 