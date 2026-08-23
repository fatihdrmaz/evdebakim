-- Malzeme paketleri: hizmetten bağımsız, seansta tek tıkla stoktan düşülebilen ürün grupları
create table material_kits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table material_kit_items (
  kit_id uuid not null references material_kits(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  primary key (kit_id, product_id)
);

alter table material_kits enable row level security;
alter table material_kit_items enable row level security;
create policy staff_all on material_kits for all using (my_role() in ('admin','hemsire','sekreter')) with check (my_role() in ('admin','hemsire','sekreter'));
create policy staff_all on material_kit_items for all using (my_role() in ('admin','hemsire','sekreter')) with check (my_role() in ('admin','hemsire','sekreter'));

-- paket düşüm: malzeme paketini seansa uygula
create or replace function apply_material_kit(p_session_id uuid, p_kit_id uuid) returns void language plpgsql security definer as $$
begin
  insert into stock_moves (product_id, quantity, type, session_id, notes, created_by)
  select i.product_id, -i.quantity, 'seans_dusum', p_session_id, (select 'paket: ' || name from material_kits where id = p_kit_id), auth.uid()
  from material_kit_items i where i.kit_id = p_kit_id;
end $$;
