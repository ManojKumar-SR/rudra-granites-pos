// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: TRANSPORTER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { generateId } from "../utils/helpers";
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
import { Icons } from "../components/ui/Icons";

export const TransporterModule = ({ transporters, setTransporters }) => {
  const [showForm, setShowForm] = useState(false);
  const [editEntity, setEditEntity] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = transporters.filter(t =>
    t.transName.toLowerCase().includes(search.toLowerCase()) ||
    t.transId?.includes(search)
  );

  const saveTransporter = (entity) => {
    if (editEntity) {
      setTransporters(prev => prev.map(t => t.id === editEntity.id ? { ...t, ...entity } : t));
    } else {
      setTransporters(prev => [...prev, { ...entity, id: generateId() }]);
    }
    setShowForm(false);
    setEditEntity(null);
  };

  const deleteTransporter = (id) => {
    if (confirm("Delete this transporter?")) {
      setTransporters(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div>
      <Card
        title="Transporter Master"
        actions={
          <div className="flex gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search transporter..." />
            <Button size="sm" onClick={() => { setEditEntity(null); setShowForm(true); }}>
              <Icons.plus size={14} /> Add Transporter
            </Button>
          </div>
        }
      >
        <Table columns={[
          { key: "transName", label: "Name", render: (r) => <span className="font-medium">{r.transName}</span> },
          { key: "transId", label: "GSTIN", render: (r) => <span className="font-mono text-xs">{r.transId}</span> },
          { key: "contact", label: "Contact" },
          { key: "email", label: "Email", render: (r) => <span className="text-sm text-gray-600">{r.email}</span> },
          { key: "address", label: "Address" },
          { key: "state", label: "State", render: (r) => STATES.find(s => s.code === r.state)?.name || r.state },
          { key: "actions", label: "", render: (r) => (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setEditEntity(r); setShowForm(true); }}>
                <Icons.edit size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteTransporter(r.id)}>
                <Icons.trash size={14} />
              </Button>
            </div>
          )},
        ]} data={filtered} emptyMsg="No transporters yet" />
      </Card>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditEntity(null); }}
        title={`${editEntity ? "Edit" : "Add"} Transporter`}
      >
        <TransporterForm
          entity={editEntity}
          onSave={saveTransporter}
          onCancel={() => { setShowForm(false); setEditEntity(null); }}
        />
      </Modal>
    </div>
  );
};

const TransporterForm = ({ entity, onSave, onCancel }) => {
  const [f, setF] = useState(entity || {
    transName: "",
    transId: "",
    contact: "",
    email: "",
    address: "",
    state: "33"
  });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [gstinValid, setGstinValid] = useState(null);

  const checkGstin = () => {
    if (f.transId) setGstinValid(validateGSTIN(f.transId));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Transporter Name *"
          value={f.transName}
          onChange={e => set("transName", e.target.value)}
          placeholder="e.g., ABC Transport Ltd"
        />
        <div>
          <Input
            label="GSTIN (Transporter ID) *"
            value={f.transId}
            onChange={e => { set("transId", e.target.value.toUpperCase()); setGstinValid(null); }}
            onBlur={checkGstin}
            maxLength={15}
            placeholder="15-digit GSTIN"
          />
          {gstinValid && <p className={`text-xs mt-1 ${gstinValid.valid ? "text-emerald-600" : "text-red-500"}`}>{gstinValid.msg}</p>}
        </div>
        <Input
          label="Contact No *"
          value={f.contact}
          onChange={e => set("contact", e.target.value)}
          placeholder="10-digit mobile"
          maxLength={10}
        />
        <Input
          label="Email"
          type="email"
          value={f.email}
          onChange={e => set("email", e.target.value)}
          placeholder="contact@transport.in"
        />
        <Input
          label="Address *"
          value={f.address}
          onChange={e => set("address", e.target.value)}
          className="sm:col-span-2"
          placeholder="Full address"
        />
        <Select
          label="State *"
          options={STATES.map(s => ({ value: s.code, label: `${s.name} (${s.code})` }))}
          value={f.state}
          onChange={e => set("state", e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave(f)}
          disabled={!f.transName || !f.transId || !f.contact || !f.address}
        >
          <Icons.check size={14} /> Save
        </Button>
      </div>
    </div>
  );
};
