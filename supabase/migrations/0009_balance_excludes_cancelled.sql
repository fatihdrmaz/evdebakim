-- Bakiye hesabı: iptal edilen seanslar toplam tutardan düşülür.
-- total = (satılan seans - iptal edilen seans) × seans fiyatı
drop view if exists sale_balances;
create view sale_balances as
  select s.*,
    greatest(s.session_count - (select count(*) from sessions x where x.sale_id = s.id and x.status = 'iptal'), 0) * s.unit_price as total,
    case when s.payer = 'kurum' then 0
         else coalesce((select sum(amount) from payments where sale_id = s.id), 0) end as paid,
    case when s.payer = 'kurum' then 0
         else greatest(s.session_count - (select count(*) from sessions x where x.sale_id = s.id and x.status = 'iptal'), 0) * s.unit_price
              - coalesce((select sum(amount) from payments where sale_id = s.id), 0) end as balance,
    (select count(*) from sessions where sale_id = s.id and status = 'tamamlandi') as done_sessions
  from sales s;
