// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

import { formatCurrency } from "../utils/formatters";
import { Stat } from "../components/ui/Stat";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Icons } from "../components/ui/Icons";





export const Dashboard = ({ invoices, products, purchases, eWayBills }) => {
  const totalSales = invoices.reduce((s, i) => s + i.total, 0);
  const totalTax = invoices.reduce((s, i) => s + i.totalTax, 0);
  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Sales" value={formatCurrency(totalSales)} icon={<Icons.chart size={16} />} trend={12} sub="this month" />
        <Stat label="Invoices" value={invoices.length} icon={<Icons.receipt size={16} />} sub="generated" />
        <Stat label="Tax Collected" value={formatCurrency(totalTax)} icon={<Icons.percent size={16} />} sub="CGST + SGST" />
        <Stat label="Low Stock" value={lowStock.length} icon={<Icons.alert size={16} />} sub="items below min" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Recent Invoices" actions={<Badge>{invoices.length} total</Badge>}>
          <Table columns={[
            { key: "invoiceNo", label: "#", render: (r) => <span className="font-mono text-xs">{r.invoiceNo}</span> },
            { key: "date", label: "Date", render: (r) => formatDate(r.date) },
            { key: "total", label: "Amount", align: "right", render: (r) => formatCurrency(r.total) },
          ]} data={invoices.slice(-5).reverse()} emptyMsg="No invoices yet" />
        </Card>
        <Card title="Stock Alerts" actions={<Badge variant={lowStock.length > 0 ? "danger" : "success"}>{lowStock.length} alerts</Badge>}>
          {lowStock.length === 0 ? <EmptyState icon={<Icons.check size={32} />} title="All stocks healthy" description="No products below minimum level" /> :
            <Table columns={[
              { key: "name", label: "Product" },
              { key: "stock", label: "Stock", align: "right", render: (r) => <span className="text-red-600 font-bold">{r.stock} {r.unit}</span> },
              { key: "minStock", label: "Min", align: "right", render: (r) => `${r.minStock}` },
            ]} data={lowStock} />}
        </Card>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Purchases" value={formatCurrency(totalPurchases)} icon={<Icons.cart size={16} />} />
        <Stat label="Products" value={products.length} icon={<Icons.box size={16} />} />
        <Stat label="E-Way Bills" value={eWayBills.length} icon={<Icons.truck size={16} />} />
        <Stat label="Gross Profit" value={formatCurrency(totalSales - totalPurchases)} icon={<Icons.chart size={16} />} trend={8} />
      </div>
    </div>
  );
};
