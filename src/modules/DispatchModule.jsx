// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 8: DISPATCH & DELIVERY
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { generateId } from "../utils/helpers";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Icons } from "../components/ui/Icons";


export const DispatchModule = ({ invoices, dispatches, setDispatches }) => {
  const [showForm, setShowForm] = useState(false);

  const saveDispatch = (data) => {
    setDispatches(prev => [...prev, { ...data, id: generateId(), status: "dispatched", createdAt: new Date().toISOString() }]);
    setShowForm(false);
  };

  return (
    <div>
      <Card title="Dispatch & Delivery" actions={<Button size="sm" onClick={() => setShowForm(true)}><Icons.plus size={14} /> New Dispatch</Button>}>
        <Table columns={[
          { key: "dispatchNo", label: "Dispatch #", render: (r) => <span className="font-mono">{r.dispatchNo}</span> },
          { key: "invoiceNo", label: "Invoice #" },
          { key: "vehicleNo", label: "Vehicle" },
          { key: "destination", label: "Destination" },
          { key: "deliveryTerms", label: "Terms" },
          { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "delivered" ? "success" : "info"}>{r.status}</Badge> },
          { key: "actions", label: "", render: (r) => r.status !== "delivered" && (
            <Button size="sm" variant="ghost" onClick={() => setDispatches(prev => prev.map(d => d.id === r.id ? { ...d, status: "delivered" } : d))}><Icons.check size={14} /> Delivered</Button>
          )},
        ]} data={dispatches} emptyMsg="No dispatches" />
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch" size="md">
        <DispatchForm invoices={invoices} onSave={saveDispatch} onCancel={() => setShowForm(false)} dispatchNo={`DSP-${(dispatches.length + 1).toString().padStart(4, "0")}`} />
      </Modal>
    </div>
  );
};

export const DispatchForm = ({ invoices, onSave, onCancel, dispatchNo }) => {
  const [f, setF] = useState({ invoiceId: "", vehicleNo: "", destination: "", deliveryTerms: "", transportDetails: "" });
  const inv = invoices.find(i => i.id === f.invoiceId);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <Select label="Invoice" options={invoices.map(i => ({ value: i.id, label: `#${i.invoiceNo}` }))} value={f.invoiceId} onChange={e => set("invoiceId", e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Vehicle No." value={f.vehicleNo} onChange={e => set("vehicleNo", e.target.value.toUpperCase())} />
        <Input label="Destination" value={f.destination} onChange={e => set("destination", e.target.value)} />
        <Input label="Delivery Terms" value={f.deliveryTerms} onChange={e => set("deliveryTerms", e.target.value)} />
        <Input label="Transport Details" value={f.transportDetails} onChange={e => set("transportDetails", e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...f, dispatchNo, invoiceNo: inv?.invoiceNo })} disabled={!f.invoiceId}><Icons.check size={14} /> Save</Button>
      </div>
    </div>
  );
};
