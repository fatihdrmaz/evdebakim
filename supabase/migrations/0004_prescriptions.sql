-- Reçeteler: hekimin muayeneye bağlı olarak yüklediği reçete belgesi (foto/PDF)
create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references encounters(id) on delete cascade,
  file_path text not null,
  file_name text,
  notes text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on prescriptions (encounter_id, created_at desc);

alter table prescriptions enable row level security;
create policy staff_all on prescriptions for all using (my_role() in ('admin','hemsire','sekreter')) with check (my_role() in ('admin','hemsire','sekreter'));
create policy doctor_prescriptions on prescriptions for all
  using (my_role()='hekim' and encounter_id in (select id from encounters where doctor_id = my_doctor_id()))
  with check (my_role()='hekim' and encounter_id in (select id from encounters where doctor_id = my_doctor_id()));

-- storage: reçete dosyaları
insert into storage.buckets (id, name, public) values ('prescriptions','prescriptions',false);
create policy prescriptions_staff on storage.objects for all using (bucket_id='prescriptions' and my_role() in ('admin','hemsire','sekreter')) with check (bucket_id='prescriptions' and my_role() in ('admin','hemsire','sekreter'));
create policy prescriptions_doctor on storage.objects for all using (bucket_id='prescriptions' and my_role()='hekim') with check (bucket_id='prescriptions' and my_role()='hekim');
