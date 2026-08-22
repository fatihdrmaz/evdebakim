# Evde Bakım — hasta / seans / stok / ödeme takibi

Next.js 16 + Supabase + Tailwind. Mobil öncelikli (hemşire telefondan kullanır, "Ana ekrana ekle" ile PWA).

## Kurulum
1. `.env.local` içine Supabase URL ve anon key girin.
2. Migration: `npx supabase link --project-ref <ref>` → `npx supabase db push` → seed için `supabase/seed.sql` içeriğini SQL Editor'de çalıştırın.
3. İlk kullanıcı: Supabase → Authentication → Users → Add user (email+şifre). Sonra SQL: `update profiles set role='admin' where id='<uuid>';`
4. `npm run dev`

## Roller
admin / hemsire / sekreter: tam erişim. hekim: sadece kendi hastaları (ödeme görmez). Hekim hesabını Ayarlar → Hekimler'de bir hekim kaydına bağlayın.

## Akış
Hasta → Satış (seans adedi + hastaya özel fiyat) → seanslar otomatik açılır → Takvim/Planla → Seans: vital (başlangıç+bitiş zorunlu), onam imzası, paket düşüm → Tamamla. Ödemeler hasta sayfasında kısmi olarak girilir; "kurum ödemeli" satışlarda bakiye 0.
