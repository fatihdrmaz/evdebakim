-- Anamneze fistül bilgisi eklendi (var ise hangi kolda)
alter table anamnesis add column fistula_side text check (fistula_side in ('sag','sol'));
