// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 10: REPORTS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
import { formatCurrency, formatDate } from "../utils/formatters";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Stat } from "../components/ui/Stat";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";
import { useState } from "react";

export const ReportsModule = ({ invoices, products, purchases, eWayBills }) => {
  const [tab, setTab] = useState("sales");

  const totalSales = invoices.reduce((s, i) => s + i.total, 0);
  const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);
  const totalTax = invoices.reduce((s, i) => s + i.totalTax, 0);
  const avgInvoice = invoices.length ? totalSales / invoices.length : 0;

  // Product sales
  const productSales = {};
  invoices.forEach(inv => inv.items.forEach(item => {
    if (!productSales[item.name]) productSales[item.name] = { name: item.name, qty: 0, amount: 0 };
    productSales[item.name].qty += item.qty;
    productSales[item.name].amount += item.amount;
  }));

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div>
      <Tabs tabs={[
        { key: "sales", label: "Sales" }, { key: "product", label: "Product Sales" },
        { key: "stock", label: "Stock Movement" }, { key: "profit", label: "Profit Analysis" },
      ]} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "sales" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Total Sales" value={formatCurrency(totalSales)} icon={<Icons.chart size={16} />} trend={12} sub="vs last month" />
              <Stat label="Invoices" value={invoices.length} icon={<Icons.receipt size={16} />} />
              <Stat label="Avg Invoice" value={formatCurrency(avgInvoice)} icon={<Icons.receipt size={16} />} />
              <Stat label="Tax Collected" value={formatCurrency(totalTax)} icon={<Icons.percent size={16} />} />
            </div>
            <Card title="Daily Sales Report">
              <Table columns={[
                { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-mono">{r.invoiceNo}</span> },
                { key: "date", label: "Date", render: (r) => formatDate(r.date) },
                { key: "subtotal", label: "Taxable", align: "right", render: (r) => formatCurrency(r.subtotal) },
                { key: "totalTax", label: "Tax", align: "right", render: (r) => formatCurrency(r.totalTax) },
                { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
              ]} data={invoices} />
            </Card>
          </div>
        )}
        {tab === "product" && (
          <Card title="Product-wise Sales">
            <Table columns={[
              { key: "name", label: "Product" },
              { key: "qty", label: "Qty Sold", align: "right", render: (r) => r.qty.toFixed(2) },
              { key: "amount", label: "Revenue", align: "right", render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
            ]} data={Object.values(productSales)} emptyMsg="No sales data" />
          </Card>
        )}
        {tab === "stock" && (
          <Card title="Stock Movement Report">
            <Table columns={[
              { key: "name", label: "Product" },
              { key: "category", label: "Category" },
              { key: "stock", label: "Current Stock", align: "right", render: (r) => <span className={r.stock <= r.minStock ? "text-red-600 font-bold" : ""}>{r.stock} {r.unit}</span> },
              { key: "minStock", label: "Min Stock", align: "right", render: (r) => `${r.minStock} ${r.unit}` },
              { key: "status", label: "Status", render: (r) => r.stock <= r.minStock ? <Badge variant="danger">Low</Badge> : <Badge variant="success">OK</Badge> },
            ]} data={products} />
          </Card>
        )}
        {tab === "profit" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Total Revenue" value={formatCurrency(totalSales)} icon={<Icons.chart size={16} />} />
              <Stat label="Total Purchases" value={formatCurrency(totalPurchases)} icon={<Icons.cart size={16} />} />
              <Stat label="Gross Profit" value={formatCurrency(totalSales - totalPurchases)} icon={<Icons.chart size={16} />} trend={8} />
              <Stat label="Low Stock Items" value={lowStockCount} icon={<Icons.alert size={16} />} />
            </div>
            <Card title="Purchase Report">
              <Table columns={[
                { key: "purchaseNo", label: "Purchase #" },
                { key: "date", label: "Date", render: (r) => formatDate(r.date) },
                { key: "supplierName", label: "Supplier" },
                { key: "total", label: "Amount", align: "right", render: (r) => formatCurrency(r.total) },
              ]} data={purchases} emptyMsg="No purchases" />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};