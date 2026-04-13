// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2: INVENTORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { generateId } from "../utils/helpers";
import { formatCurrency } from "../utils/formatters";
import { PRODUCT_CATEGORIES, UNITS } from "../constants";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";


export const InventoryModule = ({ products, setProducts }) => {
  const [tab, setTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("damage");

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.hsn.includes(search);
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const saveProduct = (data) => {
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data } : p));
    } else {
      setProducts(prev => [...prev, { ...data, id: generateId() }]);
    }
    setShowForm(false); setEditProduct(null);
  };

  const deleteProduct = (id) => {
    if (confirm("Delete this product?")) setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = () => {
    if (!adjustQty || !adjustModal) return;
    const qty = parseFloat(adjustQty);
    setProducts(prev => prev.map(p => p.id === adjustModal.id ? { ...p, stock: Math.max(0, p.stock - qty) } : p));
    setAdjustModal(null); setAdjustQty(""); setAdjustReason("damage");
  };

  return (
    <div>
      <Tabs tabs={[{ key: "list", label: "Products" }, { key: "alerts", label: `Low Stock (${lowStockProducts.length})` }]} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "list" ? (
          <Card title="Product Inventory"
            actions={<div className="flex items-center gap-2 flex-wrap">
              <Select options={PRODUCT_CATEGORIES.map(c => ({ value: c, label: c }))} value={catFilter} onChange={e => setCatFilter(e.target.value)} />
              <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
              <Button size="sm" onClick={() => { setEditProduct(null); setShowForm(true); }}><Icons.plus size={14} /> Add Product</Button>
            </div>}>
            <Table columns={[
              { key: "name", label: "Product", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.category} · {r.size} · {r.thickness}</div></div> },
              { key: "hsn", label: "HSN" },
              { key: "stock", label: "Stock", align: "right", render: (r) => <span className={r.stock <= r.minStock ? "text-red-600 font-medium" : ""}>{r.stock} {r.unit}</span> },
              { key: "rate", label: "Rate", align: "right", render: (r) => formatCurrency(r.rate) },
              { key: "taxRate", label: "Tax", align: "right", render: (r) => `${r.taxRate}%` },
              { key: "warehouse", label: "Warehouse" },
              { key: "actions", label: "", render: (r) => (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setAdjustModal(r)} title="Adjust Stock"><Icons.box size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditProduct(r); setShowForm(true); }}><Icons.edit size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteProduct(r.id)}><Icons.trash size={14} /></Button>
                </div>
              )},
            ]} data={filtered} />
          </Card>
        ) : (
          <Card title="Low Stock Alerts">
            {lowStockProducts.length === 0 ? <EmptyState icon={<Icons.check size={40} />} title="All Good" description="No products are below minimum stock level" /> :
              <Table columns={[
                { key: "name", label: "Product" },
                { key: "stock", label: "Current Stock", align: "right", render: (r) => <span className="text-red-600 font-bold">{r.stock} {r.unit}</span> },
                { key: "minStock", label: "Min Stock", align: "right", render: (r) => `${r.minStock} ${r.unit}` },
                { key: "deficit", label: "Deficit", align: "right", render: (r) => <Badge variant="danger">{r.minStock - r.stock} {r.unit}</Badge> },
              ]} data={lowStockProducts} />}
          </Card>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditProduct(null); }} title={editProduct ? "Edit Product" : "Add Product"}>
        <ProductForm product={editProduct} onSave={saveProduct} onCancel={() => { setShowForm(false); setEditProduct(null); }} />
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal open={!!adjustModal} onClose={() => setAdjustModal(null)} title={`Adjust Stock: ${adjustModal?.name}`} size="sm">
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded text-sm">Current Stock: <strong>{adjustModal?.stock} {adjustModal?.unit}</strong></div>
          <Select label="Reason" options={[{ value: "damage", label: "Damage" }, { value: "wastage", label: "Wastage" }, { value: "correction", label: "Correction" }]} value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
          <Input label="Quantity to Deduct" type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAdjustModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={adjustStock}>Adjust</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const ProductForm = ({ product, onSave, onCancel }) => {
  const [f, setF] = useState(product || { name: "", category: "Granite", hsn: "", unit: "sqf", thickness: "", size: "", rate: "", taxRate: 18, stock: "", minStock: "", warehouse: "Main" });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Product Name *" value={f.name} onChange={e => set("name", e.target.value)} />
        <Select label="Category" options={PRODUCT_CATEGORIES} value={f.category} onChange={e => set("category", e.target.value)} />
        <Input label="HSN Code *" value={f.hsn} onChange={e => set("hsn", e.target.value)} />
        <Select label="Unit" options={UNITS} value={f.unit} onChange={e => set("unit", e.target.value)} />
        <Input label="Size" value={f.size} onChange={e => set("size", e.target.value)} placeholder="e.g., 8x4" />
        <Input label="Thickness" value={f.thickness} onChange={e => set("thickness", e.target.value)} placeholder="e.g., 18mm" />
        <Input label="Rate (₹) *" type="number" value={f.rate} onChange={e => set("rate", parseFloat(e.target.value) || "")} />
        <Input label="Tax Rate (%)" type="number" value={f.taxRate} onChange={e => set("taxRate", parseFloat(e.target.value) || "")} />
        <Input label="Current Stock" type="number" value={f.stock} onChange={e => set("stock", parseFloat(e.target.value) || "")} />
        <Input label="Minimum Stock" type="number" value={f.minStock} onChange={e => set("minStock", parseFloat(e.target.value) || "")} />
        <Input label="Warehouse" value={f.warehouse} onChange={e => set("warehouse", e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(f)} disabled={!f.name || !f.hsn || !f.rate}><Icons.check size={14} /> Save</Button>
      </div>
    </div>
  );
};

