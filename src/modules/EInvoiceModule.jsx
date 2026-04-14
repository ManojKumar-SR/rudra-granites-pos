// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7: E-INVOICE (JSON Generation for IRP Portal Upload)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "../utils/formatters";
import { STATES } from "../constants";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";

const getDateLabel = (dateStr) => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
  const invoiceDateStr = new Date(dateStr).toISOString().split("T")[0];
  if (invoiceDateStr === todayStr) return "Today";
  if (invoiceDateStr === yesterdayStr) return "Yesterday";
  return "";
};

const getDateKey = (dateStr) => new Date(dateStr).toISOString().split("T")[0];

const groupByDate = (invoices) => {
  const groups = {};
  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach((inv) => {
    const key = getDateKey(inv.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(inv);
  });
  return groups;
};

const buildEInvoiceJSON = (invoice, company, customer) => {
  const isInterState = customer?.state !== company.stateCode;
  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: isInterState ? "INTER" : "INTRA", RegRev: "N", IgstOnIntra: "N" },
    DocDtls: { Typ: "INV", No: invoice.invoiceNo, Dt: new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) },
    SellerDtls: { Gstin: company.gstin, LglNm: company.name, Addr1: company.address, Loc: "THUCKALAY", Pin: 629175, Stcd: company.stateCode },
    BuyerDtls: { Gstin: customer?.gstin || "URP", LglNm: customer?.name || "", Addr1: customer?.address || "", Loc: customer?.address?.split(",")[0] || "", Pin: 629169, Stcd: customer?.state || "", Pos: customer?.state || company.stateCode },
    ItemList: invoice.items.map((item, idx) => ({
      SlNo: String(idx + 1), PrdDesc: item.name, IsServc: "N", HsnCd: item.hsn, Qty: item.qty,
      Unit: item.unit === "sqf" ? "SQF" : item.unit === "piece" ? "PCS" : "NOS",
      UnitPrice: item.rate, TotAmt: item.amount, AssAmt: item.amount, GstRt: item.taxRate,
      IgstAmt: isInterState ? item.amount * item.taxRate / 100 : 0,
      CgstAmt: !isInterState ? item.amount * item.taxRate / 200 : 0,
      SgstAmt: !isInterState ? item.amount * item.taxRate / 200 : 0,
      CesRt: 0, CesAmt: 0, TotItemVal: item.amount + (item.amount * item.taxRate / 100),
    })),
    ValDtls: { AssVal: invoice.subtotal, CgstVal: invoice.cgst || 0, SgstVal: invoice.sgst || 0, IgstVal: invoice.igst || 0, CesVal: 0, Discount: 0, OthChrg: 0, TotInvVal: invoice.total },
  };
};

export const EInvoiceModule = ({ invoices, setInvoices, company, customers }) => {
  const [tab, setTab] = useState("invoices");
  // Separate selection state for each tab
  const [convertSelection, setConvertSelection] = useState(new Set());
  const [exportSelection, setExportSelection] = useState(new Set());
  const [viewJson, setViewJson] = useState(null);

  const converted = invoices.filter((inv) => inv.jsonConverted);
  const unconverted = invoices.filter((inv) => !inv.jsonConverted);
  const allGroups = useMemo(() => groupByDate(invoices), [invoices]);
  const convertedGroups = useMemo(() => groupByDate(converted), [converted]);

  // ─── Tab 1 selection (convert) ──────────────────────────────────────────
  const toggleConvert = (id) => {
    const inv = invoices.find(i => i.id === id);
    if (inv?.jsonConverted) return;
    setConvertSelection((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleConvertDateGroup = (dateKey) => {
    const group = (allGroups[dateKey] || []).filter(inv => !inv.jsonConverted);
    if (!group.length) return;
    const all = group.every((inv) => convertSelection.has(inv.id));
    setConvertSelection((prev) => { const n = new Set(prev); group.forEach((inv) => { if (all) n.delete(inv.id); else n.add(inv.id); }); return n; });
  };
  const selectAllConvert = () => {
    if (convertSelection.size === unconverted.length) setConvertSelection(new Set());
    else setConvertSelection(new Set(unconverted.map((inv) => inv.id)));
  };
  const convertSelected = () => {
    if (convertSelection.size === 0) return;
    setInvoices((prev) => prev.map((inv) => convertSelection.has(inv.id) ? { ...inv, jsonConverted: true, jsonConvertedAt: new Date().toISOString() } : inv));
    setConvertSelection(new Set());
  };

  // ─── Tab 2 selection (export) ───────────────────────────────────────────
  const toggleExport = (id) => {
    setExportSelection((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleExportDateGroup = (dateKey) => {
    const group = convertedGroups[dateKey] || [];
    if (!group.length) return;
    const all = group.every((inv) => exportSelection.has(inv.id));
    setExportSelection((prev) => { const n = new Set(prev); group.forEach((inv) => { if (all) n.delete(inv.id); else n.add(inv.id); }); return n; });
  };
  const selectAllExport = () => {
    if (exportSelection.size === converted.length) setExportSelection(new Set());
    else setExportSelection(new Set(converted.map((inv) => inv.id)));
  };

  // ─── Download JSON ──────────────────────────────────────────────────────
  const downloadJSON = (invoicesToExport) => {
    const jsonPayload = invoicesToExport.map((inv) => {
      const customer = customers.find((c) => c.id === inv.customerId);
      return buildEInvoiceJSON(inv, company, customer);
    });
    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `e-invoices-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSelected = () => {
    const toExport = converted.filter(inv => exportSelection.has(inv.id));
    if (toExport.length === 0) return;
    downloadJSON(toExport);
  };

  const previewJSON = (inv) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    setViewJson({ invoice: inv, json: buildEInvoiceJSON(inv, company, customer) });
  };

  // ─── Date group renderer ────────────────────────────────────────────────
  // mode: "convert" = tab1 (checkbox for unconverted only), "export" = tab2 (checkbox for all in group)
  const renderDateGroup = (dateKey, group, mode) => {
    const label = getDateLabel(dateKey);
    const formattedDate = new Date(dateKey).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    const sel = mode === "convert" ? convertSelection : exportSelection;
    const toggleFn = mode === "convert" ? toggleConvert : toggleExport;
    const toggleGroupFn = mode === "convert" ? toggleConvertDateGroup : toggleExportDateGroup;

    const checkableInGroup = mode === "convert" ? group.filter(inv => !inv.jsonConverted) : group;
    const allChecked = checkableInGroup.length > 0 && checkableInGroup.every((inv) => sel.has(inv.id));
    const someChecked = checkableInGroup.some((inv) => sel.has(inv.id));

    return (
      <div key={dateKey} className="mb-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          {checkableInGroup.length > 0 ? (
            <input type="checkbox" checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={() => toggleGroupFn(dateKey)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer" />
          ) : <div className="w-4" />}
          <div>
            {label && <span className="text-sm font-semibold text-gray-900 mr-2">{label}</span>}
            <span className="text-sm text-gray-500">{formattedDate}</span>
            <span className="ml-2 text-xs text-gray-400">({group.length} invoice{group.length > 1 ? "s" : ""})</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.map((inv) => {
                const cust = customers.find((c) => c.id === inv.customerId);
                const isConverted = inv.jsonConverted;
                const canCheck = mode === "export" || !isConverted;
                return (
                  <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${mode === "convert" && isConverted ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      {canCheck ? (
                        <input type="checkbox" checked={sel.has(inv.id)} onChange={() => toggleFn(inv.id)}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer" />
                      ) : <div className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3">{cust?.name || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.subtotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.totalTax)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      {isConverted ? <Badge variant="success">JSON Ready</Badge> : <Badge variant="warning">Pending</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => previewJSON(inv)}><Icons.file size={14} /> Preview</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Tabs tabs={[
        { key: "invoices", label: `Invoices (${invoices.length})` },
        { key: "export", label: `JSON Export (${converted.length})` },
      ]} active={tab} onChange={(t) => { setTab(t); setExportSelection(new Set()); }} />

      <div className="mt-4">
        {/* ─── TAB 1: All invoices, select unconverted to convert ────────── */}
        {tab === "invoices" && (
          <div>
            {invoices.length === 0 ? (
              <Card><EmptyState icon={<Icons.receipt size={40} />} title="No Invoices" description="Create invoices from the Billing module. They will appear here for JSON conversion." /></Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-3">
                    {unconverted.length > 0 ? (
                      <>
                        <input type="checkbox"
                          checked={convertSelection.size === unconverted.length && unconverted.length > 0}
                          ref={(el) => { if (el) el.indeterminate = convertSelection.size > 0 && convertSelection.size < unconverted.length; }}
                          onChange={selectAllConvert}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer" />
                        <span className="text-sm text-gray-600">
                          {convertSelection.size > 0 ? `${convertSelection.size} invoice${convertSelection.size > 1 ? "s" : ""} selected` : `Select all (${unconverted.length} pending)`}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">All invoices have been converted to JSON</span>
                    )}
                  </div>
                  <Button onClick={convertSelected} disabled={convertSelection.size === 0}>
                    <Icons.check size={14} /> Convert to JSON ({convertSelection.size})
                  </Button>
                </div>
                {Object.keys(allGroups).sort((a, b) => new Date(b) - new Date(a)).map((dateKey) => renderDateGroup(dateKey, allGroups[dateKey], "convert"))}
              </>
            )}
          </div>
        )}

        {/* ─── TAB 2: Only converted, select which to export ────────────── */}
        {tab === "export" && (
          <div>
            {converted.length === 0 ? (
              <Card><EmptyState icon={<Icons.download size={40} />} title="No JSON Files Ready" description="Select invoices from the Invoices tab and convert them to JSON first." /></Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-3">
                    <input type="checkbox"
                      checked={exportSelection.size === converted.length && converted.length > 0}
                      ref={(el) => { if (el) el.indeterminate = exportSelection.size > 0 && exportSelection.size < converted.length; }}
                      onChange={selectAllExport}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer" />
                    <span className="text-sm text-gray-600">
                      {exportSelection.size > 0 ? `${exportSelection.size} invoice${exportSelection.size > 1 ? "s" : ""} selected` : `Select all (${converted.length} ready)`}
                    </span>
                  </div>
                  <Button onClick={exportSelected} disabled={exportSelection.size === 0}>
                    <Icons.download size={14} /> Export Selected JSON ({exportSelection.size})
                  </Button>
                </div>
                {Object.keys(convertedGroups).sort((a, b) => new Date(b) - new Date(a)).map((dateKey) => renderDateGroup(dateKey, convertedGroups[dateKey], "export"))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── JSON Preview Modal ──────────────────────────────────────────── */}
      <Modal open={!!viewJson} onClose={() => setViewJson(null)} title={`JSON Preview — Invoice #${viewJson?.invoice?.invoiceNo}`} size="lg">
        {viewJson && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">IRP-compatible e-Invoice JSON format</span>
              <Button size="sm" variant="secondary" onClick={() => downloadJSON([viewJson.invoice])}><Icons.download size={14} /> Download This</Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-[50vh] font-mono leading-relaxed">{JSON.stringify(viewJson.json, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
};