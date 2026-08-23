-- Muayeneye bağlı genel dosyalar (kimlik fotoğrafı, lab sonucu, diğer)
create table encounter_documents (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references encounters(id) on delete cascade,
  category text not null check (category in ('kimlik','lab','diger')),
  file_path text not null,
  file_name text,
  notes text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on encounter_documents (encounter_id, created_at desc);

alter table encounter_documents enable row level security;
create policy staff_all on encounter_documents for all using (my_role() in ('admin','hemsire','sekreter')) with check (my_role() in ('admin','hemsire','sekreter'));
create policy doctor_documents on encounter_documents for all
  using (my_role()='hekim' and encounter_id in (select id from encounters where doctor_id = my_doctor_id()))
  with check (my_role()='hekim' and encounter_id in (select id from encounters where doctor_id = my_doctor_id()));

-- storage: genel dosyalar
insert into storage.buckets (id, name, public) values ('documents','documents',false);
create policy documents_staff on storage.objects for all using (bucket_id='documents' and my_role() in ('admin','hemsire','sekreter')) with check (bucket_id='documents' and my_role() in ('admin','hemsire','sekreter'));
create policy documents_doctor on storage.objects for all using (bucket_id='documents' and my_role()='hekim') with check (bucket_id='documents' and my_role()='hekim');
