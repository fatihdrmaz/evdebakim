import SubNav from "@/components/SubNav";
export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SubNav items={[{ href: "/stok", label: "Ürünler", exact: true }, { href: "/stok/paketler", label: "Malzeme Paketleri" }, { href: "/stok/faturalar", label: "Alış Faturaları" }, { href: "/stok/hareketler", label: "Stok Hareketleri" }]} />
      {children}
    </div>
  );
}
