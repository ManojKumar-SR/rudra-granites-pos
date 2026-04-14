// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7: E-INVOICE (JSON Generation + Signed Response Upload)
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
import { Input } from "../components/ui/Input";

// ─── BUILD E-INVOICE JSON (GST Portal Format) ───────────────────────────────

const buildEInvoiceJSON = (invoice, company, customer) => {
  const isInterState = customer?.state !== company.stateCode;

  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: invoice.invoiceNo,
      Dt: new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    },
    SellerDtls: {
      Gstin: company.gstin,
      LglNm: company.name,
      Addr1: company.address,
      Loc: company.city || "THUCKALAY",
      Pin: company.pin || 629175,
      Stcd: company.stateCode
    },
    BuyerDtls: {
      Gstin: customer?.gstin || "URP",
      LglNm: customer?.name || "",
      Addr1: customer?.address || "",
      Loc: customer?.city || "",
      Pin: customer?.pin || 0,
      Stcd: customer?.state || "",
      Pos: customer?.state || company.stateCode
    },
    DispDtls: {
      Nm: company.name,
      Addr1: company.address,
      Loc: company.city || "THUCKALAY",
      Pin: company.pin || 629175,
      Stcd: company.stateCode
    },
    ShipDtls: {
      Gstin: customer?.gstin || "URP",
      LglNm: customer?.name || "",
      Addr1: customer?.address || "",
      Loc: customer?.city || "",
      Pin: customer?.pin || 0,
      Stcd: customer?.state || ""
    },
    ItemList: invoice.items.map((item, idx) => ({
      ItemNo: idx,
      SlNo: String(idx + 1),
      IsServc: "N",
      PrdDesc: item.name,
      HsnCd: item.hsn,
      Qty: item.qty,
      FreeQty: 0,
      Unit: item.unit === "sqf" ? "SQF" : item.unit === "piece" ? "PCS" : "NOS",
      UnitPrice: item.rate,
      TotAmt: item.amount,
      Discount: 0,
      PreTaxVal: 0,
      AssAmt: item.amount,
      GstRt: item.taxRate,
      IgstAmt: isInterState ? item.amount * item.taxRate / 100 : 0,
      CgstAmt: !isInterState ? item.amount * item.taxRate / 200 : 0,
      SgstAmt: !isInterState ? item.amount * item.taxRate / 200 : 0,
      CesRt: 0,
      CesAmt: 0,
      CesNonAdvlAmt: 0,
      StateCesRt: 0,
      StateCesAmt: 0,
      StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: item.amount + (item.amount * item.taxRate / 100)
    })),
    ValDtls: {
      AssVal: invoice.subtotal,
      CgstVal: invoice.cgst || 0,
      SgstVal: invoice.sgst || 0,
      IgstVal: invoice.igst || 0,
      CesVal: 0,
      StCesVal: 0,
      Discount: 0,
      OthChrg: 0,
      RndOffAmt: 0,
      TotInvVal: invoice.total
    }
  };
};

// ─── DATE GROUPING UTILITIES ───────────────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════════════════

export const EInvoiceModule = ({ invoices, setInvoices, company, customers }) => {
  const [tab, setTab] = useState("invoices");
  const [convertSelection, setConvertSelection] = useState(new Set());
  const [signedSelection, setSignedSelection] = useState(new Set());
  const [viewJson, setViewJson] = useState(null);

  const unconverted = invoices.filter((inv) => !inv.jsonConverted);
  const converted = invoices.filter((inv) => inv.jsonConverted);
  const signed = invoices.filter((inv) => inv.irn);

  const allGroups = useMemo(() => groupByDate(invoices), [invoices]);
  const convertedGroups = useMemo(() => groupByDate(converted), [converted]);

  // ─── Tab 1: Convert to JSON ────────────────────────────────────────────
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

  // ─── Tab 2: Export JSON ────────────────────────────────────────────────
  const toggleExport = (id) => {
    setSignedSelection((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleExportDateGroup = (dateKey) => {
    const group = convertedGroups[dateKey] || [];
    if (!group.length) return;
    const all = group.every((inv) => signedSelection.has(inv.id));
    setSignedSelection((prev) => { const n = new Set(prev); group.forEach((inv) => { if (all) n.delete(inv.id); else n.add(inv.id); }); return n; });
  };

  const selectAllExport = () => {
    if (signedSelection.size === converted.length) setSignedSelection(new Set());
    else setSignedSelection(new Set(converted.map((inv) => inv.id)));
  };

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
    const toExport = converted.filter(inv => signedSelection.has(inv.id));
    if (toExport.length === 0) return;
    downloadJSON(toExport);
  };

  const previewJSON = (inv) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    setViewJson({ invoice: inv, json: buildEInvoiceJSON(inv, company, customer) });
  };


  // ─── Date group renderer ────────────────────────────────────────────────
  const renderDateGroup = (dateKey, group, mode) => {
    const label = getDateLabel(dateKey);
    const formattedDate = new Date(dateKey).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    const sel = mode === "convert" ? convertSelection : signedSelection;
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.map((inv) => {
                const cust = customers.find((c) => c.id === inv.customerId);
                const isConverted = inv.jsonConverted;
                const canCheck = mode === "convert" ? !isConverted : true;
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
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      {inv.irn ? (
                        <Badge variant="success">Signed ✅</Badge>
                      ) : isConverted ? (
                        <Badge variant="warning">JSON Ready</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
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
        { key: "invoices", label: `Generate JSON (${unconverted.length})` },
        { key: "export", label: `Export JSON (${converted.filter(i => !i.irn).length})` },
      ]} active={tab} onChange={setTab} />

      <div className="mt-4">
        {/* ─── TAB 1: Generate JSON ────────────────────────────────────────── */}
        {tab === "invoices" && (
          <div>
            {invoices.length === 0 ? (
              <Card><EmptyState icon={<Icons.receipt size={40} />} title="No Invoices" description="Create invoices from the Billing module first." /></Card>
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
                          {convertSelection.size > 0 ? `${convertSelection.size} selected` : `${unconverted.length} pending conversion`}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">All invoices converted to JSON</span>
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

        {/* ─── TAB 2: Export JSON ──────────────────────────────────────────── */}
        {tab === "export" && (
          <div>
            {converted.filter(i => !i.irn).length === 0 ? (
              <Card><EmptyState icon={<Icons.download size={40} />} title="No JSON to Export" description="All converted invoices have been signed. Go to Upload Signed tab." /></Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-3">
                    <input type="checkbox"
                      checked={signedSelection.size === converted.length && converted.length > 0}
                      ref={(el) => { if (el) el.indeterminate = signedSelection.size > 0 && signedSelection.size < converted.length; }}
                      onChange={selectAllExport}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer" />
                    <span className="text-sm text-gray-600">
                      {signedSelection.size > 0 ? `${signedSelection.size} selected` : `${converted.filter(i => !i.irn).length} ready for export`}
                    </span>
                  </div>
                  <Button onClick={exportSelected} disabled={signedSelection.size === 0}>
                    <Icons.download size={14} /> Download JSON ({signedSelection.size})
                  </Button>
                </div>
                {Object.keys(convertedGroups).sort((a, b) => new Date(b) - new Date(a)).map((dateKey) => {
                  const filtered = convertedGroups[dateKey].filter(i => !i.irn);
                  return filtered.length > 0 ? renderDateGroup(dateKey, filtered, "export") : null;
                })}
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
              <span className="text-sm text-gray-500">GST Portal-compatible JSON format</span>
              <Button size="sm" variant="secondary" onClick={() => downloadJSON([viewJson.invoice])}><Icons.download size={14} /> Download This</Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-[50vh] font-mono leading-relaxed">{JSON.stringify(viewJson.json, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
};
