// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4: PURCHASE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { generateId, today } from "../utils/helpers";
import { formatCurrency, formatDate } from "../utils/formatters";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";

export const PurchaseModule = ({ products, setProducts, suppliers, purchases, setPurchases }) => {
  const [tab, setTab] = useState("list");
  const [showForm, setShowForm] = useState(false);

  const savePurchase = (purchase) => {
    const updatedProducts = [...products];
    purchase.items.forEach(item => {
      const pi = updatedProducts.findIndex(p => p.id === item.productId);
      if (pi >= 0) updatedProducts[pi] = { ...updatedProducts[pi], stock: updatedProducts[pi].stock + item.qty };
    });
    setProducts(updatedProducts);
    setPurchases(prev => [...prev, { ...purchase, id: generateId(), date: today(), status: "received" }]);
    setShowForm(false);
  };

  return (
    <div>
      <Tabs tabs={[{ key: "list", label: "Purchase List" }, { key: "returns", label: "Purchase Returns" }]} active={tab} onChange={setTab} />
      <div className="mt-4">
        <Card title="Purchase Orders" actions={<Button size="sm" onClick={() => setShowForm(true)}><Icons.plus size={14} /> New Purchase</Button>}>
          <Table columns={[
            { key: "purchaseNo", label: "Purchase #", render: (r) => <span className="font-mono">{r.purchaseNo}</span> },
            { key: "date", label: "Date", render: (r) => formatDate(r.date) },
            { key: "supplier", label: "Supplier", render: (r) => r.supplierName },
            { key: "items", label: "Items", render: (r) => `${r.items.length} item(s)` },
            { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
            { key: "status", label: "Status", render: (r) => <Badge variant="success">{r.status}</Badge> },
          ]} data={purchases} emptyMsg="No purchases yet" />
        </Card>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Purchase Entry" size="lg">
        <PurchaseForm products={products} suppliers={suppliers} onSave={savePurchase} onCancel={() => setShowForm(false)} purchaseNo={`PO-${(purchases.length + 1).toString().padStart(4, "0")}`} />
      </Modal>
    </div>
  );
};

export const PurchaseForm = ({ products, suppliers, onSave, onCancel, purchaseNo }) => {
  const [form, setForm] = useState({ supplierId: "", invoiceNo: "", items: [] });
  const [itemForm, setItemForm] = useState({ productId: "", qty: "", purchaseRate: "" });
  const supplier = suppliers.find(s => s.id === form.supplierId);

  const addItem = () => {
    const product = products.find(p => p.id === itemForm.productId);
    if (!product || !itemForm.qty) return;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: product.id, name: product.name, qty: parseFloat(itemForm.qty),
        purchaseRate: parseFloat(itemForm.purchaseRate) || product.rate,
        unit: product.unit, hsn: product.hsn,
        amount: parseFloat(itemForm.qty) * (parseFloat(itemForm.purchaseRate) || product.rate)
      }]
    }));
    setItemForm({ productId: "", qty: "", purchaseRate: "" });
  };

  const total = form.items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Purchase No." value={purchaseNo} readOnly />
        <Select label="Supplier *" options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.gstin})` }))} value={form.supplierId} onChange={e => setForm(prev => ({ ...prev, supplierId: e.target.value }))} />
        <Input label="Supplier Invoice No." value={form.invoiceNo} onChange={e => setForm(prev => ({ ...prev, invoiceNo: e.target.value }))} />
      </div>
      {supplier && <div className="p-2 bg-gray-50 rounded text-xs">GSTIN: {supplier.gstin} | {supplier.address}</div>}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <Select label="Product" className="flex-1" options={products.map(p => ({ value: p.id, label: p.name }))} value={itemForm.productId} onChange={e => setItemForm(prev => ({ ...prev, productId: e.target.value }))} />
        <Input label="Qty" type="number" className="w-24" value={itemForm.qty} onChange={e => setItemForm(prev => ({ ...prev, qty: e.target.value }))} />
        <Input label="Rate" type="number" className="w-28" value={itemForm.purchaseRate} onChange={e => setItemForm(prev => ({ ...prev, purchaseRate: e.target.value }))} placeholder="Purchase rate" />
        <Button onClick={addItem}><Icons.plus size={14} /> Add</Button>
      </div>
      {form.items.length > 0 && (
        <>
          <Table columns={[
            { key: "name", label: "Product" },
            { key: "qty", label: "Qty", align: "right", render: (r) => `${r.qty} ${r.unit}` },
            { key: "purchaseRate", label: "Rate", align: "right", render: (r) => formatCurrency(r.purchaseRate) },
            { key: "amount", label: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
          ]} data={form.items} />
          <div className="text-right font-bold text-lg">Total: {formatCurrency(total)}</div>
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, purchaseNo, supplierName: supplier?.name, total })} disabled={!form.supplierId || form.items.length === 0}><Icons.check size={14} /> Save</Button>
      </div>
    </div>
  );
};
