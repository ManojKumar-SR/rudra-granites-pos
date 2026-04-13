// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6: E-WAY BILLING (MasterIndia GSP API Integration)
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


export const EWayModule = ({ invoices, customers, eWayBills, setEWayBills, company, gspConfig }) => {
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("list");
  const [updateVehicleModal, setUpdateVehicleModal] = useState(null);
  const [extendModal, setExtendModal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulates API call — backend will replace with actual MasterIndia GSP call
  // POST {GSP_BASE}/ewaybillapi/v1.03/ewayapi/genewaybill
  const generateEWay = async (data) => {
    setLoading(true);
    try {
      // TODO: Backend will call MasterIndia API here
      // Endpoint: POST /ewaybillapi/v1.03/ewayapi/genewaybill
      // Auth: Bearer token from /ewaybillapi/v1.03/authenticate
      const ewb = {
        ...data, id: generateId(),
        ewayNo: `EWB${Date.now().toString().slice(-12)}`,
        generatedAt: new Date().toISOString(),
        status: "active",
        validUntil: new Date(Date.now() + data.validityDays * 86400000).toISOString(),
        apiSource: "masterindia_gsp",
        apiStatus: "synced", // synced | pending | failed
        partA: true, partB: !!data.vehicleNo,
      };
      setEWayBills(prev => [...prev, ewb]);
      setShowForm(false);
    } catch (err) {
      alert("E-Way Bill generation failed: " + (err.message || "API error"));
    }
    setLoading(false);
  };

  // POST /ewaybillapi/v1.03/ewayapi/canewb
  const cancelEWay = (id) => {
    const reason = prompt("Cancellation reason:\n1 - Duplicate\n2 - Order Cancelled\n3 - Data Entry Mistake\n4 - Others\n\nEnter reason number:");
    if (!reason) return;
    const reasons = { "1": "Duplicate", "2": "Order Cancelled", "3": "Data Entry Mistake", "4": "Others" };
    // TODO: Backend calls POST /ewaybillapi/v1.03/ewayapi/canewb
    setEWayBills(prev => prev.map(e => e.id === id ? { ...e, status: "cancelled", cancelReason: reasons[reason] || "Others", cancelledAt: new Date().toISOString() } : e));
  };

  // POST /ewaybillapi/v1.03/ewayapi/updatevehicle
  const updateVehicle = (id, vehicleNo, reason) => {
    // TODO: Backend calls POST /ewaybillapi/v1.03/ewayapi/updatevehicle
    setEWayBills(prev => prev.map(e => e.id === id ? { ...e, vehicleNo, vehicleUpdatedAt: new Date().toISOString() } : e));
    setUpdateVehicleModal(null);
  };

  // POST /ewaybillapi/v1.03/ewayapi/extendvalidity
  const extendValidity = (id, newVehicle, remainingDist) => {
    const extra = Math.ceil(remainingDist / 100);
    // TODO: Backend calls POST /ewaybillapi/v1.03/ewayapi/extendvalidity
    setEWayBills(prev => prev.map(e => e.id === id ? {
      ...e, vehicleNo: newVehicle || e.vehicleNo,
      validUntil: new Date(new Date(e.validUntil).getTime() + extra * 86400000).toISOString(),
      extended: true,
    } : e));
    setExtendModal(null);
  };

  const activeEWBs = eWayBills.filter(e => e.status === "active");
  const isConnected = gspConfig?.apiKey && gspConfig?.gstin;

  return (
    <div>
      <Tabs tabs={[
        { key: "list", label: "E-Way Bills" },
        { key: "consolidated", label: "Consolidated" },
        { key: "partb", label: "Part-B Pending" },
      ]} active={tab} onChange={setTab} />

      {/* GSP Connection Status */}
      <div className={`mt-3 px-4 py-2.5 rounded-md text-sm flex items-center justify-between ${isConnected ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className={isConnected ? "text-emerald-700" : "text-amber-700"}>
            MasterIndia GSP: {isConnected ? "Connected" : "Not configured — go to Admin → GSP Settings"}
          </span>
        </div>
        {isConnected && <Badge variant="success">API Active</Badge>}
      </div>

      <div className="mt-4">
        {tab === "list" && (
          <Card title="E-Way Bills" actions={<Button size="sm" onClick={() => setShowForm(true)} disabled={!isConnected}><Icons.plus size={14} /> Generate E-Way Bill</Button>}>
            <Table columns={[
              { key: "ewayNo", label: "E-Way Bill No.", render: (r) => <span className="font-mono font-medium">{r.ewayNo}</span> },
              { key: "invoiceNo", label: "Invoice #" },
              { key: "generatedAt", label: "Generated", render: (r) => formatDate(r.generatedAt) },
              { key: "vehicleNo", label: "Vehicle" },
              { key: "transportMode", label: "Mode" },
              { key: "distance", label: "Distance", render: (r) => `${r.distance} km` },
              { key: "validUntil", label: "Valid Until", render: (r) => {
                const isExpired = new Date(r.validUntil) < new Date();
                return <span className={isExpired && r.status === "active" ? "text-red-600 font-medium" : ""}>{formatDate(r.validUntil)} {isExpired && r.status === "active" ? "(Expired)" : ""}</span>;
              }},
              { key: "apiStatus", label: "API", render: (r) => <Badge variant={r.apiStatus === "synced" ? "success" : r.apiStatus === "failed" ? "danger" : "warning"}>{r.apiStatus || "local"}</Badge> },
              { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "active" ? "success" : "danger"}>{r.status}</Badge> },
              { key: "actions", label: "", render: (r) => r.status === "active" && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setUpdateVehicleModal(r)} title="Update Vehicle"><Icons.truck size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setExtendModal(r)} title="Extend Validity"><Icons.edit size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => cancelEWay(r.id)} title="Cancel"><Icons.x size={14} /></Button>
                </div>
              )},
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
                action={<Button disabled={activeEWBs.length < 2}><Icons.plus size={14} /> Create Consolidated EWB</Button>}
              />
              {activeEWBs.length < 2 && <p className="text-center text-xs text-gray-400 mt-2">Need at least 2 active E-Way Bills</p>}
            </div>
          </Card>
        )}

        {tab === "partb" && (
          <Card title="Part-B Pending (Transport Details Missing)">
            <Table columns={[
              { key: "ewayNo", label: "E-Way Bill No.", render: (r) => <span className="font-mono">{r.ewayNo}</span> },
              { key: "invoiceNo", label: "Invoice #" },
              { key: "status", label: "Part-B", render: (r) => r.partB ? <Badge variant="success">Complete</Badge> : <Badge variant="warning">Pending</Badge> },
              { key: "action", label: "", render: (r) => !r.partB && <Button size="sm" onClick={() => setUpdateVehicleModal(r)}><Icons.truck size={14} /> Add Vehicle</Button> },
            ]} data={eWayBills.filter(e => e.status === "active")} emptyMsg="No pending Part-B entries" />
          </Card>
        )}
      </div>

      {/* Generate E-Way Bill Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Generate E-Way Bill via MasterIndia GSP" size="lg">
        <EWayForm invoices={invoices} customers={customers} company={company} onSave={generateEWay} onCancel={() => setShowForm(false)} loading={loading} />
      </Modal>

      {/* Update Vehicle Modal */}
      <Modal open={!!updateVehicleModal} onClose={() => setUpdateVehicleModal(null)} title={`Update Vehicle — ${updateVehicleModal?.ewayNo}`} size="sm">
        <UpdateVehicleForm ewb={updateVehicleModal} onSave={(veh, reason) => updateVehicle(updateVehicleModal.id, veh, reason)} onCancel={() => setUpdateVehicleModal(null)} />
      </Modal>

      {/* Extend Validity Modal */}
      <Modal open={!!extendModal} onClose={() => setExtendModal(null)} title={`Extend Validity — ${extendModal?.ewayNo}`} size="sm">
        <ExtendValidityForm ewb={extendModal} onSave={(veh, dist) => extendValidity(extendModal.id, veh, dist)} onCancel={() => setExtendModal(null)} />
      </Modal>
    </div>
  );
};

const EWayForm = ({ invoices, customers, company, onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    invoiceId: "", vehicleNo: "", transporterId: "", transporterName: "",
    transportMode: "Road", distance: "", vehicleType: "Regular",
    transDocNo: "", transDocDate: today(),
    fromPincode: "", toPincode: "", fromPlace: "", toPlace: "",
  });
  const invoice = invoices.find(i => i.id === form.invoiceId);
  const customer = invoice ? customers.find(c => c.id === invoice.customerId) : null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const distance = parseFloat(form.distance) || 0;
  const validityDays = distance <= 100 ? 1 : distance <= 300 ? 3 : Math.ceil(distance / 100);
  const isInterState = customer && customer.state !== company.stateCode;

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        <strong>MasterIndia GSP:</strong> This will generate an E-Way Bill via the MasterIndia API endpoint. Ensure GSP credentials are configured in Admin settings.
      </div>

      <Select label="Select Invoice *" options={invoices.filter(i => i.status === "active").map(i => ({ value: i.id, label: `#${i.invoiceNo} — ${formatCurrency(i.total)}` }))} value={form.invoiceId} onChange={e => set("invoiceId", e.target.value)} />
      {invoice && (
        <div className="p-3 bg-gray-50 rounded text-sm space-y-1">
          <div><strong>Invoice #{invoice.invoiceNo}</strong> — {formatDate(invoice.date)} — {formatCurrency(invoice.total)}</div>
          <div>Customer: {customer?.name} | GSTIN: {customer?.gstin}</div>
          <div>From: {company.stateName} → To: {STATES.find(s => s.code === customer?.state)?.name} {isInterState ? "(Inter-State → IGST)" : "(Intra-State)"}</div>
          <div>Supply Type: {isInterState ? "OUTWARD - Inter-State" : "OUTWARD - Intra-State"}</div>
        </div>
      )}

      {/* Part A - Document Details (auto-filled from invoice) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Part A — Document & Goods Details (auto-filled from invoice)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="From Pincode" value={form.fromPincode} onChange={e => set("fromPincode", e.target.value)} placeholder="629175" maxLength={6} />
          <Input label="To Pincode" value={form.toPincode} onChange={e => set("toPincode", e.target.value)} placeholder="629169" maxLength={6} />
          <Input label="From Place" value={form.fromPlace} onChange={e => set("fromPlace", e.target.value)} placeholder="THUCKALAY" />
          <Input label="To Place" value={form.toPlace} onChange={e => set("toPlace", e.target.value)} placeholder={customer?.address || "Destination"} />
        </div>
      </div>

      {/* Part B - Transport Details */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Part B — Transport Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Mode of Transport *" options={TRANSPORT_MODES.map((m, i) => ({ value: String(i + 1), label: m }))} value={form.transportMode} onChange={e => set("transportMode", e.target.value)} />
          <Input label="Vehicle Number *" value={form.vehicleNo} onChange={e => set("vehicleNo", e.target.value.toUpperCase())} placeholder="TN74AB1234" />
          <Input label="Transporter ID (GSTIN)" value={form.transporterId} onChange={e => set("transporterId", e.target.value.toUpperCase())} placeholder="GSTIN of transporter" maxLength={15} />
          <Input label="Transporter Name" value={form.transporterName} onChange={e => set("transporterName", e.target.value)} placeholder="Transport company name" />
          <Input label="Transport Doc No." value={form.transDocNo} onChange={e => set("transDocNo", e.target.value)} placeholder="LR/RR/CN number" />
          <Input label="Transport Doc Date" type="date" value={form.transDocDate} onChange={e => set("transDocDate", e.target.value)} />
          <Select label="Vehicle Type" options={[{ value: "Regular", label: "Regular" }, { value: "ODC", label: "Over Dimensional Cargo (ODC)" }]} value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)} />
          <Input label="Approx Distance (km) *" type="number" value={form.distance} onChange={e => set("distance", e.target.value)} placeholder="e.g., 45" />
        </div>
      </div>

      {distance > 0 && (
        <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded flex items-center justify-between">
          <span>E-Way Bill Validity: <strong>{validityDays} day(s)</strong> for {distance} km</span>
          <span className="text-xs">(1 day per 100 km or part thereof)</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, invoiceNo: invoice?.invoiceNo, validityDays })} disabled={!form.invoiceId || !form.vehicleNo || !form.distance || loading}>
          {loading ? "Generating..." : <><Icons.check size={14} /> Generate via GSP</>}
        </Button>
      </div>
    </div>
  );
};

const UpdateVehicleForm = ({ ewb, onSave, onCancel }) => {
  const [vehicleNo, setVehicleNo] = useState("");
  const [reason, setReason] = useState("breakdown");
  return (
    <div className="space-y-3">
      <div className="p-3 bg-gray-50 rounded text-sm">Current Vehicle: <strong>{ewb?.vehicleNo}</strong></div>
      <Input label="New Vehicle Number *" value={vehicleNo} onChange={e => setVehicleNo(e.target.value.toUpperCase())} placeholder="TN74CD5678" />
      <Select label="Reason for Change" options={[
        { value: "breakdown", label: "Breakdown" }, { value: "transhipment", label: "Transhipment" },
        { value: "others", label: "Others" },
      ]} value={reason} onChange={e => setReason(e.target.value)} />
      <p className="text-xs text-gray-400">API: POST /ewaybillapi/v1.03/ewayapi/updatevehicle</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(vehicleNo, reason)} disabled={!vehicleNo}><Icons.check size={14} /> Update via GSP</Button>
      </div>
    </div>
  );
};

const ExtendValidityForm = ({ ewb, onSave, onCancel }) => {
  const [vehicleNo, setVehicleNo] = useState(ewb?.vehicleNo || "");
  const [remainingDist, setRemainingDist] = useState("");
  return (
    <div className="space-y-3">
      <div className="p-3 bg-gray-50 rounded text-sm space-y-1">
        <div>E-Way Bill: <strong>{ewb?.ewayNo}</strong></div>
        <div>Current Validity: {ewb ? formatDate(ewb.validUntil) : "—"}</div>
      </div>
      <Input label="Vehicle Number" value={vehicleNo} onChange={e => setVehicleNo(e.target.value.toUpperCase())} />
      <Input label="Remaining Distance (km) *" type="number" value={remainingDist} onChange={e => setRemainingDist(e.target.value)} placeholder="e.g., 150" />
      {remainingDist && <div className="text-sm text-blue-600">Extended by: {Math.ceil(parseFloat(remainingDist) / 100)} additional day(s)</div>}
      <p className="text-xs text-gray-400">API: POST /ewaybillapi/v1.03/ewayapi/extendvalidity</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(vehicleNo, parseFloat(remainingDist))} disabled={!remainingDist}><Icons.check size={14} /> Extend via GSP</Button>
      </div>
    </div>
  );
};
