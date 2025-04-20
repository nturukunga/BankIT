-- First, disable Row Level Security temporarily to allow fixes
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to create a new user (needed for registration)
CREATE POLICY "Allow anyone to create users" 
ON "User" 
FOR INSERT
TO PUBLIC
WITH CHECK (true);

-- Create a policy that only allows users to view their own data
CREATE POLICY "Users can view their own data" 
ON "User" 
FOR SELECT 
USING (auth.uid()::text = id);

-- Create a policy that only allows users to update their own data
CREATE POLICY "Users can update their own data" 
ON "User" 
FOR UPDATE 
USING (auth.uid()::text = id);

-- Create a policy that allows the service role to do everything
CREATE POLICY "Service role can do everything" 
ON "User" 
USING (auth.role() = 'service_role');

-- Re-enable Row Level Security with the new policies
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY; 