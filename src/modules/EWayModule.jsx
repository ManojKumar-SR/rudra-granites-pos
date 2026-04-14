// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6: E-WAY BILLING (Simplified)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { generateId, today } from "../utils/helpers";
import { formatCurrency, formatDate } from "../utils/formatters";
import { STATES } from "../constants";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Icons } from "../components/ui/Icons";

// ─── GENERATE E-WAY BILL JSON ───────────────────────────────────────────────

const buildEWayBillJSON = (form) => {
  const distance = form.distance ? parseFloat(form.distance) : null;
  if (!distance || isNaN(distance)) {
    throw new Error("Distance must be a valid number");
  }
  return {
    Irn: form.irn,
    TransId: form.transId,
    TransName: form.transName,
    TransMode: form.transMode,
    Distance: distance,
    TransDocNo: form.transDocNo,
    TransDocDt: form.transDocDt,
    VehNo: form.vehicleNo,
    VehType: form.vehicleType
  };
};

// ─── VALIDITY CALCULATION ───────────────────────────────────────────────────

const getValidityDays = (distance) => {
  const d = parseFloat(distance);
  if (d <= 100) return 1;
  if (d <= 250) return 3;
  if (d <= 500) return 5;
  if (d <= 1000) return 10;
  return 15;
};

export const EWayModule = ({ invoices, customers, transporters, setInvoices }) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Only signed invoices (with IRN)
  const signedInvoices = invoices.filter(inv => inv.irn);

  const downloadJSON = (inv) => {
    if (!inv.ewbJson) return;
    const blob = new Blob([JSON.stringify(inv.ewbJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eway-bill-${inv.invoiceNo}-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatus = (inv) => {
    if (inv.ewbSigned && inv.ewbNo) return "✓ Signed";
    if (inv.ewbGenerated) return "✓ Generated";
    return "⧗ Pending";
  };

  return (
    <div>
      <Card title="E-Way Bills">
        <Table
          columns={[
            { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-mono font-medium">{r.invoiceNo}</span> },
            { key: "date", label: "Date", render: (r) => formatDate(r.date) },
            { key: "customer", label: "Customer", render: (r) => customers.find(c => c.id === r.customerId)?.name || "—" },
            { key: "irn", label: "IRN", render: (r) => <span className="font-mono text-xs text-gray-600 truncate" title={r.irn}>{r.irn.substring(0, 12)}...</span> },
            { key: "ewbNo", label: "E-Way Bill No.", render: (r) => r.ewbNo ? <span className="font-mono font-bold text-green-700">{r.ewbNo}</span> : <span className="text-gray-400">—</span> },
            { key: "status", label: "Status", render: (r) => {
              const status = getStatus(r);
              if (status === "✓ Signed") return <Badge variant="success">{status}</Badge>;
              if (status === " Generated") return <Badge variant="warning">{status}</Badge>;
              return <Badge variant="secondary">{status}</Badge>;
            }},
            { key: "actions", label: "", render: (r) => (
              <div className="flex items-center gap-1">
                {!r.ewbGenerated && (
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedInvoice(r); setShowGenerateModal(true); }} title="Generate E-Way Bill">
                    <Icons.plus size={14} /> Generate
                  </Button>
                )}
                {r.ewbGenerated && (
                  <>
                    {!r.ewbSigned && <Button size="sm" variant="ghost" onClick={() => downloadJSON(r)} title="Download JSON">
                      <Icons.download size={14} />
                    </Button>}
                    {!r.ewbSigned && <Button size="sm" variant="ghost" onClick={() => setShowViewModal(r)} title="View JSON">
                      <Icons.file size={14} />
                    </Button>}
                    {!r.ewbSigned && (
                      <Button size="sm" variant="ghost" onClick={() => setShowUploadModal(r)} title="Upload Signed JSON">
                        <Icons.plus size={14} />
                      </Button>
                    )}
                  </>
                )}
                {r.ewbSigned && (
                  <Button size="sm" variant="ghost" onClick={() => setShowViewModal(r)} title="View E-Way Bill">
                    <Icons.file size={14} /> View
                  </Button>
                )}
              </div>
            )},
          ]}
          data={signedInvoices}
          emptyMsg="No signed invoices. Create and sign invoices first."
        />
      </Card>

      {/* ─── GENERATE E-WAY BILL MODAL ────────────────────────────────────── */}
      <Modal
        open={showGenerateModal && selectedInvoice}
        onClose={() => { setShowGenerateModal(false); setSelectedInvoice(null); }}
        title={`Generate E-Way Bill for Invoice #${selectedInvoice?.invoiceNo}`}
        size="lg"
      >
        {selectedInvoice && (
          <EWayBillForm
            invoice={selectedInvoice}
            customers={customers}
            transporters={transporters}
            onGenerate={(form) => {
              try {
                const jsonData = buildEWayBillJSON({...form, irn: selectedInvoice.irn});
                setInvoices(prev => prev.map(inv =>
                  inv.id === selectedInvoice.id
                    ? { ...inv, ewbGenerated: true, ewbGeneratedAt: new Date().toISOString(), ewbJson: jsonData }
                    : inv
                ));
                setShowGenerateModal(false);
                setSelectedInvoice(null);
                alert(`E-Way Bill JSON generated!`);
              } catch (err) {
                alert(`Error: ${err.message}`);
              }
            }}
            onCancel={() => { setShowGenerateModal(false); setSelectedInvoice(null); }}
          />
        )}
      </Modal>

      {/* ─── VIEW JSON MODAL ──────────────────────────────────────────────── */}
      <Modal
        open={!!showViewModal && !showViewModal.ewbSigned}
        onClose={() => setShowViewModal(null)}
        title={`E-Way Bill JSON - Invoice #${showViewModal?.invoiceNo}`}
        size="lg"
      >
        {showViewModal && showViewModal.ewbJson && (
          <div className="space-y-3">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-64 font-mono leading-relaxed">
              {JSON.stringify(showViewModal.ewbJson, null, 2)}
            </pre>
            <div className="text-xs text-gray-600">Copy this JSON and upload to ewaybillgst.gov.in</div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowViewModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── VIEW E-WAY BILL MODAL ────────────────────────────────────────── */}
      <Modal
        open={!!showViewModal && showViewModal?.ewbSigned}
        onClose={() => setShowViewModal(null)}
        title={`E-Way Bill #${showViewModal?.ewbNo}`}
        size="lg"
      >
        {showViewModal?.ewbSigned && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded">
                <div className="text-xs text-gray-600 mb-1">E-Way Bill Number</div>
                <div className="font-mono font-bold text-lg text-green-700">{showViewModal.ewbNo}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Status</div>
                <div className="font-medium text-green-700">✓ Active</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Generated</div>
                <div>{formatDate(showViewModal.ewbDt)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Valid Until</div>
                <div className="font-medium">{formatDate(showViewModal.ewbValidTill)}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="font-medium mb-2">Invoice</div>
              <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
                <div>Invoice #: <span className="font-mono">{showViewModal.invoiceNo}</span></div>
                <div>IRN: <span className="font-mono">{showViewModal.irn.substring(0, 20)}...</span></div>
              </div>
            </div>

            {showViewModal.ewbJson && (
              <div className="border-t pt-4">
                <div className="font-medium mb-2">Transport Details</div>
                <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
                  <div>Mode: {showViewModal.ewbJson.TransMode === "1" ? "Road" : showViewModal.ewbJson.TransMode === "2" ? "Rail" : showViewModal.ewbJson.TransMode === "3" ? "Air" : "Ship"}</div>
                  <div>Distance: {showViewModal.ewbJson.Distance} km</div>
                  <div>Vehicle: {showViewModal.ewbJson.VehNo} ({showViewModal.ewbJson.VehType === "R" ? "Regular" : "ODC"})</div>
                  <div>Transporter: {showViewModal.ewbJson.TransName}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowViewModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── UPLOAD SIGNED JSON MODAL ─────────────────────────────────────── */}
      <Modal
        open={!!showUploadModal}
        onClose={() => setShowUploadModal(null)}
        title={`Upload Signed JSON - Invoice #${showUploadModal?.invoiceNo}`}
        size="md"
      >
        {showUploadModal && (
          <div className="space-y-4">
            

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    try {
                      const data = JSON.parse(evt.target?.result || "");
                      const response = Array.isArray(data) ? data[0] : data;
                      if (!response.EwbNo) {
                        alert("Invalid: Missing EwbNo");
                        return;
                      }
                      setInvoices(prev => prev.map(inv =>
                        inv.id === showUploadModal.id
                          ? {
                              ...inv,
                              ewbNo: response.EwbNo,
                              ewbDt: response.EwbDt,
                              ewbValidTill: response.EwbValidTill,
                              ewbStatus: response.Status || "ACT",
                              ewbSigned: true
                            }
                          : inv
                      ));
                      setShowUploadModal(null);
                      alert(`E-Way Bill #${response.EwbNo} signed!`);
                    } catch (err) {
                      alert(`nvalid JSON: ${err.message}`);
                    }
                  };
                  reader.readAsText(file);
                }}
                className="hidden"
                id="upload-file"
              />
              <label htmlFor="upload-file" className="cursor-pointer">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-medium text-gray-700">Click to upload</div>
                <div className="text-xs text-gray-500">or drag and drop</div>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowUploadModal(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── E-WAY BILL FORM ────────────────────────────────────────────────────────

const EWayBillForm = ({ invoice, customers, transporters, onGenerate, onCancel }) => {
  const customer = customers.find(c => c.id === invoice.customerId);
  const [form, setForm] = useState({
    transId: transporters[0]?.transId || "",
    transName: transporters[0]?.transName || "",
    transMode: "1",
    distance: "",
    transDocNo: "",
    transDocDt: today(),
    vehicleNo: "",
    vehicleType: "R"
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleTransporterChange = (e) => {
    const trans = transporters.find(t => t.transId === e.target.value);
    if (trans) {
      set("transId", trans.transId);
      set("transName", trans.transName);
    }
  };

  const validityDays = form.distance ? getValidityDays(form.distance) : 0;
  const isValid = form.transId && form.distance && form.vehicleNo && form.transDocNo && form.transDocDt && !isNaN(parseFloat(form.distance));

  return (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 rounded text-sm">
        <div>Invoice: <span className="font-mono font-medium">{invoice.invoiceNo}</span></div>
        <div>Customer: <span className="font-medium">{customer?.name}</span></div>
        <div>IRN: <span className="font-mono text-xs text-gray-600">{invoice.irn.substring(0, 20)}...</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Transporter *"
          options={transporters.map(t => ({ value: t.transId, label: `${t.transName}` }))}
          value={form.transId}
          onChange={handleTransporterChange}
        />
        <Select
          label="Transport Mode *"
          options={[
            { value: "1", label: "Road" },
            { value: "2", label: "Rail" },
            { value: "3", label: "Air" },
            { value: "4", label: "Ship" }
          ]}
          value={form.transMode}
          onChange={e => set("transMode", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input
            label="Distance (km) *"
            type="number"
            value={form.distance}
            onChange={e => set("distance", e.target.value)}
            min="1"
            max="9999"
          />
          {form.distance && !isNaN(parseFloat(form.distance)) && (
            <div className="text-xs text-gray-600 mt-1">Validity: {validityDays} day{validityDays > 1 ? "s" : ""}</div>
          )}
        </div>
        <Input
          label="Vehicle No *"
          value={form.vehicleNo}
          onChange={e => set("vehicleNo", e.target.value.toUpperCase())}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Vehicle Type *"
          options={[
            { value: "R", label: "Regular (R)" },
            { value: "O", label: "Over-Dimensional (O)" }
          ]}
          value={form.vehicleType}
          onChange={e => set("vehicleType", e.target.value)}
        />
        <Input
          label="Transport Doc No *"
          value={form.transDocNo}
          onChange={e => set("transDocNo", e.target.value)}
        />
      </div>

      <Input
        label="Transport Doc Date *"
        type="date"
        value={form.transDocDt}
        onChange={e => set("transDocDt", e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onGenerate(form)} disabled={!isValid}>
          <Icons.check size={14} /> Generate
        </Button>
      </div>
    </div>
  );
};
