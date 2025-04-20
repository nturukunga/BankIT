-- Create a trigger function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."User" (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, "User".name);
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to automatically handle new users
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- Create RLS policies
alter table public."User" enable row level security;

create policy "Users can view their own data"
  on public."User"
  for all
  using (auth.uid() = id);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public."User" to anon, authenticated; 