// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6: E-WAY BILLING
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { generateId, today } from "../utils/helpers";
import { formatCurrency, formatDate } from "../utils/formatters";
import { STATES, TRANSPORT_MODES } from "../constants";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";

export const EWayModule = ({ invoices, customers, eWayBills, setEWayBills, company }) => {
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("list");

  const generateEWay = (data) => {
    const ewb = {
      ...data, id: generateId(),
      ewayNo: `EWB${Date.now().toString().slice(-10)}`,
      generatedAt: new Date().toISOString(),
      status: "active",
      validUntil: new Date(Date.now() + data.validityDays * 86400000).toISOString(),
    };
    setEWayBills(prev => [...prev, ewb]);
    setShowForm(false);
  };

  const cancelEWay = (id) => {
    if (confirm("Cancel this E-Way Bill?")) setEWayBills(prev => prev.map(e => e.id === id ? { ...e, status: "cancelled" } : e));
  };

  return (
    <div>
      <Tabs tabs={[{ key: "list", label: "E-Way Bills" }, { key: "consolidated", label: "Consolidated" }]} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "list" && (
          <Card title="E-Way Bills" actions={<Button size="sm" onClick={() => setShowForm(true)}><Icons.plus size={14} /> Generate E-Way Bill</Button>}>
            <Table columns={[
              { key: "ewayNo", label: "E-Way Bill No.", render: (r) => <span className="font-mono font-medium">{r.ewayNo}</span> },
              { key: "invoiceNo", label: "Invoice #", render: (r) => r.invoiceNo },
              { key: "generatedAt", label: "Generated", render: (r) => formatDate(r.generatedAt) },
              { key: "vehicleNo", label: "Vehicle" },
              { key: "distance", label: "Distance", render: (r) => `${r.distance} km` },
              { key: "validUntil", label: "Valid Until", render: (r) => formatDate(r.validUntil) },
              { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "active" ? "success" : "danger"}>{r.status}</Badge> },
              { key: "actions", label: "", render: (r) => r.status === "active" && <Button size="sm" variant="ghost" onClick={() => cancelEWay(r.id)}><Icons.x size={14} /> Cancel</Button> },
            ]} data={eWayBills} emptyMsg="No E-Way Bills generated" />
          </Card>
        )}

        {tab === "consolidated" && (
          <Card title="Consolidated E-Way Bill">
            <div className="p-6">
              <EmptyState
                icon={<Icons.truck size={40} />}
                title="Consolidated E-Way Bills"
                description="Group multiple E-Way Bills into a consolidated bill for a single vehicle carrying multiple consignments"
              />
            </div>
          </Card>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Generate E-Way Bill" size="lg">
        <EWayForm invoices={invoices} customers={customers} company={company} onSave={generateEWay} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
};

const EWayForm = ({ invoices, customers, company, onSave, onCancel }) => {
  const [form, setForm] = useState({ invoiceId: "", vehicleNo: "", transporterId: "", transportMode: "Road", distance: "" });
  const invoice = invoices.find(i => i.id === form.invoiceId);
  const customer = invoice ? customers.find(c => c.id === invoice.customerId) : null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const distance = parseFloat(form.distance) || 0;
  const validityDays = distance <= 100 ? 1 : Math.ceil(distance / 100);

  return (
    <div className="space-y-4">
      <Select label="Select Invoice *" options={invoices.filter(i => i.status === "active").map(i => ({ value: i.id, label: `#${i.invoiceNo} — ${formatCurrency(i.total)}` }))} value={form.invoiceId} onChange={e => set("invoiceId", e.target.value)} />
      {invoice && (
        <div className="p-3 bg-gray-50 rounded text-xs space-y-1">
          <div><strong>Invoice #{invoice.invoiceNo}</strong> — {formatDate(invoice.date)}</div>
          <div>Customer: {customer?.name} | Value: {formatCurrency(invoice.total)}</div>
          <div>From: {company.stateName} → To: {STATES.find(s => s.code === customer?.state)?.name}</div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Vehicle Number *" value={form.vehicleNo} onChange={e => set("vehicleNo", e.target.value.toUpperCase())} placeholder="TN 74 AB 1234" />
        <Input label="Transporter ID" value={form.transporterId} onChange={e => set("transporterId", e.target.value)} placeholder="GSTIN of transporter" />
        <Select label="Mode of Transport" options={TRANSPORT_MODES} value={form.transportMode} onChange={e => set("transportMode", e.target.value)} />
        <Input label="Distance (km) *" type="number" value={form.distance} onChange={e => set("distance", e.target.value)} />
      </div>
      {distance > 0 && <div className="p-2 bg-blue-50 text-blue-700 text-xs rounded">E-Way Bill Validity: {validityDays} day(s) for {distance} km</div>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, invoiceNo: invoice?.invoiceNo, validityDays })} disabled={!form.invoiceId || !form.vehicleNo || !form.distance}><Icons.check size={14} /> Generate</Button>
      </div>
    </div>
  );
};