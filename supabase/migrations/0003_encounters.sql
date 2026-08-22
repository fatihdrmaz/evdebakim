-- Muayene (encounter): hastanın her başvurusu. Satış ve seanslar muayeneye bağlanır.
create type encounter_status as enum ('acik','kapali');

create table encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid references doctors(id),
  status encounter_status not null default 'acik',
  opened_at date not null default current_date,
  closed_at date,
  complaint text,          -- başvuru nedeni / şikayet
  diagnosis text,          -- tanı / hekim notu
  plan text,               -- tedavi planı
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on encounters (patient_id, opened_at desc);

alter table sales add column encounter_id uuid references encounters(id) on delete cascade;
create index on sales (encounter_id);

alter table encounters enable row level security;
create policy staff_all on encounters for all using (my_role() in ('admin','hemsire','sekreter')) with check (my_role() in ('admin','hemsire','sekreter'));
create policy doctor_encounters on encounters for select using (my_role()='hekim' and patient_id in (select id from patients where doctor_id=my_doctor_id()));

-- sale_balances görünümüne encounter_id zaten s.* ile gelir; yeniden oluştur
drop view if exists sale_balances;
create view sale_balances as
  select s.*,
    (s.session_count * s.unit_price) as total,
    case when s.payer='kurum' then 0 else coalesce((select sum(amount) from payments where sale_id=s.id),0) end as paid,
    case when s.payer='kurum' then 0 else (s.session_count*s.unit_price) - coalesce((select sum(amount) from payments where sale_id=s.id),0) end as balance,
    (select count(*) from sessions where sale_id=s.id and status='tamamlandi') as done_sessions
  from sales s;
