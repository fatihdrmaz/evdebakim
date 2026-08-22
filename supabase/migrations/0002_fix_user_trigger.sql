create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email),
          coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'hemsire'));
  return new;
end $$;
grant usage on schema public to supabase_auth_admin;
grant insert on public.profiles to supabase_auth_admin;
