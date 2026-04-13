// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5: GST & TAX MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { formatCurrency, formatDate } from "../utils/formatters";
import { validateGSTIN } from "../utils/validators";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Stat } from "../components/ui/Stat";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";


export const GSTModule = ({ products, invoices, company }) => {
  const [tab, setTab] = useState("summary");
  const [gstinCheck, setGstinCheck] = useState("");
  const [gstinResult, setGstinResult] = useState(null);

  const totalTaxable = invoices.reduce((s, i) => s + i.subtotal, 0);
  const totalCGST = invoices.reduce((s, i) => s + (i.cgst || 0), 0);
  const totalSGST = invoices.reduce((s, i) => s + (i.sgst || 0), 0);
  const totalIGST = invoices.reduce((s, i) => s + (i.igst || 0), 0);
  const totalTax = totalCGST + totalSGST + totalIGST;

  // HSN summary
  const hsnMap = {};
  invoices.forEach(inv => inv.items.forEach(item => {
    if (!hsnMap[item.hsn]) hsnMap[item.hsn] = { hsn: item.hsn, taxable: 0, tax: 0, qty: 0 };
    hsnMap[item.hsn].taxable += item.amount;
    hsnMap[item.hsn].tax += item.amount * item.taxRate / 100;
    hsnMap[item.hsn].qty += item.qty;
  }));

  return (
    <div>
      <Tabs tabs={[{ key: "summary", label: "Tax Summary" }, { key: "hsn", label: "HSN Summary" }, { key: "validate", label: "GSTIN Validator" }, { key: "rates", label: "Tax Rates" }]} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "summary" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Taxable Value" value={formatCurrency(totalTaxable)} icon={<Icons.receipt size={16} />} />
              <Stat label="CGST Collected" value={formatCurrency(totalCGST)} icon={<Icons.percent size={16} />} />
              <Stat label="SGST Collected" value={formatCurrency(totalSGST)} icon={<Icons.percent size={16} />} />
              <Stat label="Total Tax" value={formatCurrency(totalTax)} icon={<Icons.shield size={16} />} />
            </div>
            <Card title="GST Ledger">
              <Table columns={[
                { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-mono">{r.invoiceNo}</span> },
                { key: "date", label: "Date", render: (r) => formatDate(r.date) },
                { key: "subtotal", label: "Taxable", align: "right", render: (r) => formatCurrency(r.subtotal) },
                { key: "cgst", label: "CGST", align: "right", render: (r) => formatCurrency(r.cgst || 0) },
                { key: "sgst", label: "SGST", align: "right", render: (r) => formatCurrency(r.sgst || 0) },
                { key: "igst", label: "IGST", align: "right", render: (r) => formatCurrency(r.igst || 0) },
                { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
              ]} data={invoices} />
            </Card>
          </div>
        )}
        {tab === "hsn" && (
          <Card title="HSN/SAC Summary">
            <Table columns={[
              { key: "hsn", label: "HSN/SAC Code", render: (r) => <span className="font-mono">{r.hsn}</span> },
              { key: "qty", label: "Total Qty", align: "right", render: (r) => r.qty.toFixed(2) },
              { key: "taxable", label: "Taxable Value", align: "right", render: (r) => formatCurrency(r.taxable) },
              { key: "tax", label: "Total Tax", align: "right", render: (r) => formatCurrency(r.tax) },
            ]} data={Object.values(hsnMap)} emptyMsg="No transactions yet" />
          </Card>
        )}
        {tab === "validate" && (
          <Card title="GSTIN Validator">
            <div className="p-4 space-y-3">
              <div className="flex gap-3 items-end">
                <Input label="Enter GSTIN" className="flex-1" value={gstinCheck} onChange={e => setGstinCheck(e.target.value.toUpperCase())} placeholder="e.g., 33AAYFR4969H1ZE" maxLength={15} />
                <Button onClick={() => setGstinResult(validateGSTIN(gstinCheck))}>Validate</Button>
              </div>
              {gstinResult && (
                <div className={`p-3 rounded-md text-sm ${gstinResult.valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {gstinResult.valid ? <><Icons.check size={14} className="inline mr-1" /> {gstinResult.msg} — State Code: {gstinResult.stateCode}</> : <><Icons.alert size={14} className="inline mr-1" /> {gstinResult.msg}</>}
                </div>
              )}
            </div>
          </Card>
        )}
        {tab === "rates" && (
          <Card title="Product Tax Rates (HSN Mapping)">
            <Table columns={[
              { key: "name", label: "Product" },
              { key: "hsn", label: "HSN Code", render: (r) => <span className="font-mono">{r.hsn}</span> },
              { key: "taxRate", label: "GST Rate", align: "right", render: (r) => <Badge variant="info">{r.taxRate}%</Badge> },
              { key: "cgst", label: "CGST", align: "right", render: (r) => `${r.taxRate / 2}%` },
              { key: "sgst", label: "SGST", align: "right", render: (r) => `${r.taxRate / 2}%` },
            ]} data={products} />
          </Card>
        )}
      </div>
    </div>
  );
};
