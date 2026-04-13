// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 9: CUSTOMER & PARTY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { generateId } from "../utils/helpers";
import { formatCurrency, formatDate } from "../utils/formatters";
import { validateGSTIN } from "../utils/validators";
import { STATES } from "../constants";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";


export const CustomerModule = ({ customers, setCustomers, suppliers, setSuppliers, invoices }) => {
  const [tab, setTab] = useState("customers");
  const [showForm, setShowForm] = useState(false);
  const [editEntity, setEditEntity] = useState(null);
  const [search, setSearch] = useState("");
  const [viewLedger, setViewLedger] = useState(null);

  const isCustomer = tab === "customers";
  const data = isCustomer ? customers : suppliers;
  const setData = isCustomer ? setCustomers : setSuppliers;

  const filtered = data.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.gstin?.includes(search));

  const saveEntity = (entity) => {
    if (editEntity) {
      setData(prev => prev.map(e => e.id === editEntity.id ? { ...e, ...entity } : e));
    } else {
      setData(prev => [...prev, { ...entity, id: generateId() }]);
    }
    setShowForm(false); setEditEntity(null);
  };

  const deleteEntity = (id) => { if (confirm("Delete?")) setData(prev => prev.filter(e => e.id !== id)); };

  const customerInvoices = viewLedger ? invoices.filter(i => i.customerId === viewLedger.id) : [];

  return (
    <div>
      <Tabs tabs={[{ key: "customers", label: "Customers" }, { key: "suppliers", label: "Suppliers" }]} active={tab} onChange={setTab} />
      <div className="mt-4">
        <Card title={isCustomer ? "Customer Master" : "Supplier Master"}
          actions={<div className="flex gap-2"><SearchBar value={search} onChange={setSearch} /><Button size="sm" onClick={() => { setEditEntity(null); setShowForm(true); }}><Icons.plus size={14} /> Add</Button></div>}>
          <Table columns={[
            { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "gstin", label: "GSTIN", render: (r) => <span className="font-mono text-xs">{r.gstin}</span> },
            { key: "mobile", label: "Mobile" },
            { key: "address", label: "Address" },
            { key: "state", label: "State", render: (r) => STATES.find(s => s.code === r.state)?.name || r.state },
            { key: "outstanding", label: "Outstanding", align: "right", render: (r) => r.outstanding ? <span className="text-red-600 font-medium">{formatCurrency(r.outstanding)}</span> : <span className="text-gray-400">—</span> },
            { key: "actions", label: "", render: (r) => (
              <div className="flex items-center gap-1">
                {isCustomer && <Button size="sm" variant="ghost" onClick={() => setViewLedger(r)} title="View Ledger"><Icons.file size={14} /></Button>}
                <Button size="sm" variant="ghost" onClick={() => { setEditEntity(r); setShowForm(true); }}><Icons.edit size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteEntity(r.id)}><Icons.trash size={14} /></Button>
              </div>
            )},
          ]} data={filtered} />
        </Card>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditEntity(null); }} title={`${editEntity ? "Edit" : "Add"} ${isCustomer ? "Customer" : "Supplier"}`}>
        <PartyForm entity={editEntity} isCustomer={isCustomer} onSave={saveEntity} onCancel={() => { setShowForm(false); setEditEntity(null); }} />
      </Modal>

      <Modal open={!!viewLedger} onClose={() => setViewLedger(null)} title={`Ledger: ${viewLedger?.name}`} size="lg">
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded text-sm">GSTIN: {viewLedger?.gstin} | Outstanding: {formatCurrency(viewLedger?.outstanding || 0)}</div>
          <Table columns={[
            { key: "invoiceNo", label: "Invoice #" },
            { key: "date", label: "Date", render: (r) => formatDate(r.date) },
            { key: "total", label: "Amount", align: "right", render: (r) => formatCurrency(r.total) },
            { key: "status", label: "Status", render: (r) => <Badge variant="success">{r.status}</Badge> },
          ]} data={customerInvoices} emptyMsg="No transactions" />
        </div>
      </Modal>
    </div>
  );
};

export const PartyForm = ({ entity, isCustomer, onSave, onCancel }) => {
  const [f, setF] = useState(entity || { name: "", mobile: "", gstin: "", address: "", state: "33", creditLimit: isCustomer ? 100000 : undefined, outstanding: 0, addresses: [{ label: "Primary", address: "" }] });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [gstinValid, setGstinValid] = useState(null);

  const checkGstin = () => { if (f.gstin) setGstinValid(validateGSTIN(f.gstin)); };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Name *" value={f.name} onChange={e => set("name", e.target.value)} />
        <Input label="Mobile *" value={f.mobile} onChange={e => set("mobile", e.target.value)} maxLength={10} />
        <div>
          <Input label="GSTIN" value={f.gstin} onChange={e => { set("gstin", e.target.value.toUpperCase()); setGstinValid(null); }} onBlur={checkGstin} maxLength={15} />
          {gstinValid && <p className={`text-xs mt-1 ${gstinValid.valid ? "text-emerald-600" : "text-red-500"}`}>{gstinValid.msg}</p>}
        </div>
        <Select label="State" options={STATES.map(s => ({ value: s.code, label: `${s.name} (${s.code})` }))} value={f.state} onChange={e => set("state", e.target.value)} />
        <Input label="Address" value={f.address} onChange={e => set("address", e.target.value)} className="sm:col-span-2" />
        {isCustomer && <Input label="Credit Limit (₹)" type="number" value={f.creditLimit} onChange={e => set("creditLimit", parseFloat(e.target.value) || 0)} />}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(f)} disabled={!f.name || !f.mobile}><Icons.check size={14} /> Save</Button>
      </div>
    </div>
  );
};
