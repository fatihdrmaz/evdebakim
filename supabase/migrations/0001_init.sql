-- ============ ENUMS ============
create type user_role as enum ('admin','hemsire','sekreter','hekim');
create type nationality as enum ('tc','yabanci');
create type payer_type as enum ('hasta','kurum');          -- kurum: parayı doktor alır
create type payment_method as enum ('nakit','kart','havale');
create type session_status as enum ('planlandi','tamamlandi','iptal');
create type vital_phase as enum ('baslangic','ara','bitis');
create type product_category as enum ('serum','ilac','sarf');
create type stock_move_type as enum ('alis','seans_dusum','manuel_dusum','duzeltme');

-- ============ PROFILES ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'hemsire',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ HEKİMLER ============
create table doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text,
  phone text,
  profile_id uuid references profiles(id),  -- sisteme giriş yapan hekim
  created_at timestamptz not null default now()
);

-- ============ HASTALAR ============
create table patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  nationality nationality not null default 'tc',
  tc_no text, passport_no text,
  birth_date date,
  gender text,
  address text,
  doctor_id uuid references doctors(id),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on patients (doctor_id);
create index on patients (phone);

-- ============ ANAMNEZ (hasta başına tek, güncellenir) ============
create table anamnesis (
  patient_id uuid primary key references patients(id) on delete cascade,
  height_cm numeric, weight_kg numeric,
  chronic_diseases text, surgeries text, allergies text,
  medications text, clinical_history text, special_conditions text,
  smoking boolean, alcohol boolean, pregnancy boolean,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- ============ HİZMETLER ============
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_price numeric(12,2) not null default 0,
  requires_consent boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ STOK ============
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category product_category not null,
  unit text not null default 'adet',
  min_stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- hizmet başına paket düşüm şablonu
create table service_kits (
  service_id uuid references services(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  primary key (service_id, product_id)
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  supplier text,
  invoice_no text,
  invoice_date date not null default current_date,
  total numeric(12,2),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2)
);

-- ============ SATIŞ ============
create table sales (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  service_id uuid not null references services(id),
  session_count integer not null check (session_count > 0),
  unit_price numeric(12,2) not null,          -- hastaya özel seans fiyatı
  payer payer_type not null default 'hasta',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on sales (patient_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method payment_method not null,
  paid_at date not null default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============ SEANSLAR ============
create table sessions (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  patient_id uuid not null references patients(id),
  seq integer not null,                       -- 1..session_count
  scheduled_at timestamptz,
  nurse_id uuid references profiles(id),
  status session_status not null default 'planlandi',
  started_at timestamptz, completed_at timestamptz,
  notes text,
  unique (sale_id, seq)
);
create index on sessions (scheduled_at);
create index on sessions (patient_id);

create table vitals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  phase vital_phase not null,
  measured_at timestamptz not null default now(),
  bp_sys integer, bp_dia integer, pulse integer,
  temp numeric(4,1), spo2 integer, glucose integer,
  notes text,
  created_by uuid references profiles(id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references sessions(id) on delete cascade,
  consent_text text not null,
  signature_path text not null,               -- storage: consents/<session_id>.png
  signer_name text not null,
  signed_at timestamptz not null default now(),
  nurse_id uuid references profiles(id)
);

-- stok hareketleri (tek doğruluk kaynağı)
create table stock_moves (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  quantity integer not null,                  -- +alış, -düşüm
  type stock_move_type not null,
  session_id uuid references sessions(id) on delete set null,
  purchase_item_id uuid references purchase_items(id) on delete cascade,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on stock_moves (product_id);

-- ============ VIEWS ============
create view product_stock as
  select p.*, coalesce(sum(m.quantity),0)::int as stock
  from products p left join stock_moves m on m.product_id = p.id
  group by p.id;

create view sale_balances as
  select s.*,
    (s.session_count * s.unit_price) as total,
    case when s.payer='kurum' then 0 else coalesce((select sum(amount) from payments where sale_id=s.id),0) end as paid,
    case when s.payer='kurum' then 0 else (s.session_count*s.unit_price) - coalesce((select sum(amount) from payments where sale_id=s.id),0) end as balance,
    (select count(*) from sessions where sale_id=s.id and status='tamamlandi') as done_sessions
  from sales s;

-- ============ TRIGGERS ============
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), coalesce((new.raw_user_meta_data->>'role')::user_role,'hemsire'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- satış açılınca seanslar otomatik oluşsun
create or replace function create_sessions_for_sale() returns trigger language plpgsql as $$
begin
  insert into sessions (sale_id, patient_id, seq)
  select new.id, new.patient_id, g from generate_series(1, new.session_count) g;
  return new;
end $$;
create trigger on_sale_created after insert on sales for each row execute function create_sessions_for_sale();

-- alış kalemi girilince stok hareketi
create or replace function purchase_item_to_stock() returns trigger language plpgsql as $$
begin
  insert into stock_moves (product_id, quantity, type, purchase_item_id, created_by)
  values (new.product_id, new.quantity, 'alis', new.id, auth.uid());
  return new;
end $$;
create trigger on_purchase_item after insert on purchase_items for each row execute function purchase_item_to_stock();

-- paket düşüm: hizmet kitini seansa uygula
create or replace function apply_service_kit(p_session_id uuid) returns void language plpgsql security definer as $$
begin
  insert into stock_moves (product_id, quantity, type, session_id, notes, created_by)
  select k.product_id, -k.quantity, 'seans_dusum', p_session_id, 'paket düşüm', auth.uid()
  from sessions s join sales sa on sa.id=s.sale_id join service_kits k on k.service_id=sa.service_id
  where s.id = p_session_id;
end $$;

-- ============ RLS ============
create or replace function my_role() returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;
create or replace function my_doctor_id() returns uuid language sql stable security definer as $$
  select id from doctors where profile_id = auth.uid()
$$;

do $$ declare t text; begin
  foreach t in array array['profiles','doctors','patients','anamnesis','services','products','service_kits','purchases','purchase_items','sales','payments','sessions','vitals','consents','stock_moves'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- staff = admin/hemsire/sekreter: her şeye tam erişim
create policy staff_all on profiles for all using (my_role() in ('admin','hemsire','sekreter')) with check (my_role() = 'admin' or id = auth.uid());
create policy self_read on profiles for select using (id = auth.uid());
do $$ declare t text; begin
  foreach t in array array['doctors','patients','anamnesis','services','products','service_kits','purchases','purchase_items','sales','payments','sessions','vitals','consents','stock_moves'] loop
    execute format('create policy staff_all on %I for all using (my_role() in (''admin'',''hemsire'',''sekreter'')) with check (my_role() in (''admin'',''hemsire'',''sekreter''))', t);
  end loop;
end $$;

-- hekim: sadece kendi hastaları, ödeme yok
create policy doctor_patients on patients for select using (my_role()='hekim' and doctor_id = my_doctor_id());
create policy doctor_anamnesis on anamnesis for select using (my_role()='hekim' and patient_id in (select id from patients where doctor_id=my_doctor_id()));
create policy doctor_sessions on sessions for select using (my_role()='hekim' and patient_id in (select id from patients where doctor_id=my_doctor_id()));
create policy doctor_vitals on vitals for select using (my_role()='hekim' and session_id in (select s.id from sessions s join patients p on p.id=s.patient_id where p.doctor_id=my_doctor_id()));
create policy doctor_services on services for select using (my_role()='hekim');
create policy doctor_self on doctors for select using (my_role()='hekim' and profile_id=auth.uid());

-- storage: onam imzaları
insert into storage.buckets (id, name, public) values ('consents','consents',false);
create policy consents_staff on storage.objects for all using (bucket_id='consents' and my_role() in ('admin','hemsire','sekreter')) with check (bucket_id='consents' and my_role() in ('admin','hemsire','sekreter'));
