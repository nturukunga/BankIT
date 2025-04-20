-- Create User table
create table if not exists public."User" (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up row level security
alter table public."User" enable row level security;

-- Create policies
create policy "Users can view their own data"
  on public."User"
  for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public."User"
  for update
  using (auth.uid() = id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
  before update on public."User"
  for each row
  execute procedure public.handle_updated_at(); 