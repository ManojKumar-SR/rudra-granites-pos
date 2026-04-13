// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7: E-INVOICE COMPLIANCE (MasterIndia GSP API Integration)
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { formatCurrency, formatDate } from "../utils/formatters";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";

export const EInvoiceModule = ({ invoices, setInvoices, gspConfig, company, customers }) => {
  const [tab, setTab] = useState("list");
  const [loading, setLoading] = useState({});
  const [viewIrn, setViewIrn] = useState(null);

  const isConnected = gspConfig?.apiKey && gspConfig?.gstin;

  // POST /eInvoice/v1.03/authenticate → then POST /eInvoice/v1.03/eInvoice/generate
  const generateIRN = async (invoiceId) => {
    setLoading(prev => ({ ...prev, [invoiceId]: true }));
    try {
      // TODO: Backend will call MasterIndia API
      // Step 1: Authenticate → POST /eInvoice/v1.03/authenticate
      // Step 2: Generate IRN → POST /eInvoice/v1.03/eInvoice/generate
      // Response includes: irn, ackNo, ackDate, signedInvoice, signedQRCode
      const irn = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      const ackNo = Math.floor(Math.random() * 9e14) + 1e14;
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {
        ...inv, irn, ackNo: String(ackNo), ackDate: new Date().toISOString(),
        einvoiceStatus: "generated", apiSource: "masterindia_gsp",
        signedQRCode: `SIGNED_QR_${irn.slice(0, 20)}`, // Backend returns actual signed QR
      } : inv));
    } catch (err) {
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, einvoiceStatus: "failed", einvoiceError: err.message } : inv));
    }
    setLoading(prev => ({ ...prev, [invoiceId]: false }));
  };

  // POST /eInvoice/v1.03/eInvoice/cancel
  const cancelIRN = (invoiceId) => {
    const reason = prompt("Cancellation reason:\n1 - Duplicate\n2 - Data Entry Mistake\n\nEnter reason number:");
    if (!reason) return;
    // TODO: Backend calls POST /eInvoice/v1.03/eInvoice/cancel
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {
      ...inv, einvoiceStatus: "cancelled", irnCancelledAt: new Date().toISOString(),
      irnCancelReason: reason === "1" ? "Duplicate" : "Data Entry Mistake",
    } : inv));
  };

  // POST /eInvoice/v1.03/eInvoice/generateEwayBill (generate EWB from IRN)
  const generateEWBfromIRN = (invoiceId) => {
    alert("E-Way Bill generation from IRN — Backend will call POST /eInvoice/v1.03/eInvoice/generateEwayBill with the IRN. This creates the E-Way Bill automatically from the e-Invoice data.");
  };

  // GET /eInvoice/v1.03/eInvoice/irn/{irn}
  const fetchIRNDetails = (invoice) => {
    // TODO: Backend calls GET endpoint with IRN
    setViewIrn(invoice);
  };

  const pendingInvoices = invoices.filter(inv => !inv.einvoiceStatus || inv.einvoiceStatus === "failed");
  const generatedInvoices = invoices.filter(inv => inv.einvoiceStatus === "generated");
  const cancelledInvoices = invoices.filter(inv => inv.einvoiceStatus === "cancelled");

  return (
    <div>
      <Tabs tabs={[
        { key: "list", label: `All E-Invoices (${invoices.length})` },
        { key: "pending", label: `Pending IRN (${pendingInvoices.length})` },
        { key: "export", label: "GST JSON Export" },
      ]} active={tab} onChange={setTab} />

      {/* GSP Connection Status */}
      <div className={`mt-3 px-4 py-2.5 rounded-md text-sm flex items-center justify-between ${isConnected ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className={isConnected ? "text-emerald-700" : "text-amber-700"}>
            MasterIndia GSP (E-Invoice): {isConnected ? "Connected" : "Not configured — go to Admin → GSP Settings"}
          </span>
        </div>
        {isConnected && <Badge variant="success">IRP Connected</Badge>}
      </div>

      <div className="mt-4">
        {tab === "list" && (
          <Card title="E-Invoice Status" actions={
            pendingInvoices.length > 0 && isConnected && (
              <Button size="sm" onClick={() => pendingInvoices.forEach(inv => generateIRN(inv.id))}>
                <Icons.check size={14} /> Generate All Pending IRN
              </Button>
            )
          }>
            <Table columns={[
              { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-mono">{r.invoiceNo}</span> },
              { key: "date", label: "Date", render: (r) => formatDate(r.date) },
              { key: "total", label: "Value", align: "right", render: (r) => formatCurrency(r.total) },
              { key: "irn", label: "IRN", render: (r) => r.irn ? (
                <span className="font-mono text-[11px] break-all cursor-pointer hover:text-blue-600" onClick={() => fetchIRNDetails(r)} title="Click to view details">{r.irn.slice(0, 20)}...</span>
              ) : <span className="text-gray-400">—</span> },
              { key: "ackNo", label: "Ack No.", render: (r) => r.ackNo || "—" },
              { key: "ackDate", label: "Ack Date", render: (r) => r.ackDate ? formatDate(r.ackDate) : "—" },
              { key: "einvoiceStatus", label: "Status", render: (r) => {
                const s = r.einvoiceStatus;
                if (s === "generated") return <Badge variant="success">IRN Generated</Badge>;
                if (s === "cancelled") return <Badge variant="danger">Cancelled</Badge>;
                if (s === "failed") return <Badge variant="danger">Failed</Badge>;
                return <Badge variant="warning">Pending</Badge>;
              }},
              { key: "actions", label: "", render: (r) => (
                <div className="flex items-center gap-1">
                  {(!r.einvoiceStatus || r.einvoiceStatus === "failed") && (
                    <Button size="sm" variant="ghost" onClick={() => generateIRN(r.id)} disabled={loading[r.id] || !isConnected}>
                      {loading[r.id] ? "..." : <><Icons.check size={14} /> Generate IRN</>}
                    </Button>
                  )}
                  {r.einvoiceStatus === "generated" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => generateEWBfromIRN(r.id)} title="Generate E-Way Bill from IRN"><Icons.truck size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => cancelIRN(r.id)} title="Cancel IRN"><Icons.x size={14} /></Button>
                    </>
                  )}
                </div>
              )},
            ]} data={invoices} emptyMsg="No invoices created yet" />
          </Card>
        )}

        {tab === "pending" && (
          <Card title="Invoices Pending IRN Generation">
            {pendingInvoices.length === 0 ? (
              <EmptyState icon={<Icons.check size={40} />} title="All Caught Up" description="All invoices have IRN generated" />
            ) : (
              <Table columns={[
                { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-mono">{r.invoiceNo}</span> },
                { key: "date", label: "Date", render: (r) => formatDate(r.date) },
                { key: "total", label: "Value", align: "right", render: (r) => formatCurrency(r.total) },
                { key: "error", label: "Error", render: (r) => r.einvoiceError ? <span className="text-red-500 text-xs">{r.einvoiceError}</span> : "—" },
                { key: "action", label: "", render: (r) => (
                  <Button size="sm" onClick={() => generateIRN(r.id)} disabled={loading[r.id] || !isConnected}>
                    {loading[r.id] ? "Generating..." : <><Icons.check size={14} /> Generate IRN</>}
                  </Button>
                )},
              ]} data={pendingInvoices} />
            )}
          </Card>
        )}

        {tab === "export" && (
          <Card title="GST Portal JSON Export">
            <div className="p-6">
              <EmptyState
                icon={<Icons.download size={40} />}
                title="Export for GST Portal"
                description="Generate government-compatible JSON files for bulk upload to GST portal. Includes all e-Invoice data with IRN, signed QR codes, and Ack details."
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => alert("JSON export generated for " + generatedInvoices.length + " invoices (Demo)")}>
                      <Icons.download size={14} /> Export E-Invoice JSON ({generatedInvoices.length})
                    </Button>
                  </div>
                }
              />
            </div>
          </Card>
        )}
      </div>

      {/* IRN Details Modal */}
      <Modal open={!!viewIrn} onClose={() => setViewIrn(null)} title={`IRN Details — Invoice #${viewIrn?.invoiceNo}`} size="md">
        {viewIrn && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded"><span className="text-gray-500 block mb-1">Invoice No.</span><strong>{viewIrn.invoiceNo}</strong></div>
              <div className="p-3 bg-gray-50 rounded"><span className="text-gray-500 block mb-1">Date</span><strong>{formatDate(viewIrn.date)}</strong></div>
              <div className="p-3 bg-gray-50 rounded sm:col-span-2"><span className="text-gray-500 block mb-1">IRN (Invoice Reference Number)</span><strong className="font-mono text-xs break-all">{viewIrn.irn}</strong></div>
              <div className="p-3 bg-gray-50 rounded"><span className="text-gray-500 block mb-1">Ack Number</span><strong>{viewIrn.ackNo}</strong></div>
              <div className="p-3 bg-gray-50 rounded"><span className="text-gray-500 block mb-1">Ack Date</span><strong>{viewIrn.ackDate ? formatDate(viewIrn.ackDate) : "—"}</strong></div>
              <div className="p-3 bg-gray-50 rounded"><span className="text-gray-500 block mb-1">Status</span><Badge variant="success">{viewIrn.einvoiceStatus}</Badge></div>
              <div className="p-3 bg-gray-50 rounded"><span className="text-gray-500 block mb-1">API Source</span><Badge variant="info">{viewIrn.apiSource || "local"}</Badge></div>
              <div className="p-3 bg-gray-50 rounded sm:col-span-2"><span className="text-gray-500 block mb-1">Signed QR Code</span><span className="font-mono text-xs break-all">{viewIrn.signedQRCode || "—"}</span></div>
            </div>
            <p className="text-xs text-gray-400">Data fetched via: GET /eInvoice/v1.03/eInvoice/irn/{"{irn}"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};




