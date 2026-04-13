// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1: BILLING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { generateId, today } from "../utils/helpers";
import { formatCurrency, formatDate, numberToWords } from "../utils/formatters";
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

export const BillingModule = ({ products, setProducts, customers, invoices, setInvoices, company }) => {
  const [tab, setTab] = useState("create");
  const [showInvoice, setShowInvoice] = useState(null);

  return (
    <div>
      <Tabs tabs={[{ key: "create", label: "Create Invoice" }, { key: "list", label: "Invoice List" }]} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "create" ? <InvoiceCreator products={products} setProducts={setProducts} customers={customers} invoices={invoices} setInvoices={setInvoices} company={company} /> :
          <InvoiceList invoices={invoices} customers={customers} onView={setShowInvoice} />}
      </div>
      <Modal open={!!showInvoice} onClose={() => setShowInvoice(null)} title={`Invoice #${showInvoice?.invoiceNo}`} size="lg">
        <InvoicePrintView invoice={showInvoice} company={company} customer={customers.find(c => c.id === showInvoice?.customerId)} />
      </Modal>
    </div>
  );
};

const InvoiceCreator = ({ products, setProducts, customers, invoices, setInvoices, company }) => {
  const nextInvoiceNo = invoices.length > 0 ? Math.max(...invoices.map(i => parseInt(i.invoiceNo))) + 1 : 4960;
  const [form, setForm] = useState({ customerId: "", invoiceType: "tax", date: today(), deliveryNote: "", paymentTerms: "", items: [] });
  const [itemForm, setItemForm] = useState({ productId: "", qty: "" });
  const selectedProduct = products.find(p => p.id === itemForm.productId);
  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const isInterState = selectedCustomer && selectedCustomer.state !== company.stateCode;

  const addItem = () => {
    if (!itemForm.productId || !itemForm.qty || parseFloat(itemForm.qty) <= 0) return;
    const product = products.find(p => p.id === itemForm.productId);
    if (!product) return;
    const qty = parseFloat(itemForm.qty);
    if (qty > product.stock) { alert(`Insufficient stock. Available: ${product.stock} ${product.unit}`); return; }
    const amount = qty * product.rate;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: product.id, name: product.name, hsn: product.hsn, qty, rate: product.rate, unit: product.unit, taxRate: product.taxRate, amount }]
    }));
    setItemForm({ productId: "", qty: "" });
  };

  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + i.amount, 0);
  const totalTax = form.items.reduce((s, i) => s + (i.amount * i.taxRate / 100), 0);
  const cgst = !isInterState ? totalTax / 2 : 0;
  const sgst = !isInterState ? totalTax / 2 : 0;
  const igst = isInterState ? totalTax : 0;
  const total = subtotal + totalTax;

  const saveInvoice = () => {
    if (!form.customerId || form.items.length === 0) { alert("Select customer and add items"); return; }
    const inv = {
      id: generateId(), invoiceNo: String(nextInvoiceNo), ...form,
      subtotal, cgst, sgst, igst, totalTax, total,
      irn: Math.random().toString(16).substr(2, 40),
      ackNo: Math.floor(Math.random() * 9e14) + 1e14,
      status: "active", createdAt: new Date().toISOString()
    };
    // Deduct stock
    const updatedProducts = [...products];
    form.items.forEach(item => {
      const pi = updatedProducts.findIndex(p => p.id === item.productId);
      if (pi >= 0) updatedProducts[pi] = { ...updatedProducts[pi], stock: updatedProducts[pi].stock - item.qty };
    });
    setProducts(updatedProducts);
    setInvoices(prev => [...prev, inv]);
    setForm({ customerId: "", invoiceType: "tax", date: today(), deliveryNote: "", paymentTerms: "", items: [] });
    alert(`Invoice #${nextInvoiceNo} created successfully!`);
  };

  return (
    <div className="space-y-4">
      <Card title={`New Invoice #${nextInvoiceNo}`}>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select label="Customer *" options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.gstin})` }))} value={form.customerId} onChange={e => setForm(prev => ({ ...prev, customerId: e.target.value }))} />
            <Select label="Invoice Type" options={[{ value: "tax", label: "Tax Invoice" }, { value: "retail", label: "Retail Invoice" }]} value={form.invoiceType} onChange={e => setForm(prev => ({ ...prev, invoiceType: e.target.value }))} />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
            <Input label="Payment Terms" value={form.paymentTerms} onChange={e => setForm(prev => ({ ...prev, paymentTerms: e.target.value }))} placeholder="e.g., Net 30" />
          </div>
          {selectedCustomer && (
            <div className="p-3 bg-gray-50 rounded-md text-xs">
              <span className="font-medium">{selectedCustomer.name}</span> — {selectedCustomer.address} — GSTIN: {selectedCustomer.gstin}
              {isInterState && <Badge variant="info" className="ml-2">Inter-State (IGST)</Badge>}
              {!isInterState && <Badge variant="success" className="ml-2">Intra-State (CGST+SGST)</Badge>}
            </div>
          )}
        </div>
      </Card>

      <Card title="Add Items">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <Select label="Product" className="flex-1" options={products.map(p => ({ value: p.id, label: `${p.name} — ₹${p.rate}/${p.unit} (Stock: ${p.stock})` }))} value={itemForm.productId} onChange={e => setItemForm(prev => ({ ...prev, productId: e.target.value }))} />
            <Input label={`Quantity ${selectedProduct ? `(${selectedProduct.unit})` : ""}`} type="number" className="w-full sm:w-32" value={itemForm.qty} onChange={e => setItemForm(prev => ({ ...prev, qty: e.target.value }))} placeholder="0" />
            <Button onClick={addItem} disabled={!itemForm.productId || !itemForm.qty}><Icons.plus size={14} /> Add</Button>
          </div>
          {selectedProduct && (
            <div className="mt-2 text-xs text-gray-500">
              HSN: {selectedProduct.hsn} | Rate: ₹{selectedProduct.rate}/{selectedProduct.unit} | Tax: {selectedProduct.taxRate}% | Available: {selectedProduct.stock} {selectedProduct.unit}
            </div>
          )}
        </div>

        {form.items.length > 0 && (
          <Table columns={[
            { key: "name", label: "Item" },
            { key: "hsn", label: "HSN" },
            { key: "qty", label: "Qty", align: "right", render: (r) => `${r.qty} ${r.unit}` },
            { key: "rate", label: "Rate", align: "right", render: (r) => formatCurrency(r.rate) },
            { key: "taxRate", label: "Tax %", align: "right", render: (r) => `${r.taxRate}%` },
            { key: "amount", label: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
            { key: "action", label: "", render: (_, i) => <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Icons.trash size={14} /></button> },
          ]} data={form.items} />
        )}
      </Card>

      {form.items.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex flex-col items-end space-y-1 text-sm">
              <div className="flex justify-between w-full max-w-xs"><span className="text-gray-500">Subtotal:</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
              {!isInterState ? (
                <>
                  <div className="flex justify-between w-full max-w-xs"><span className="text-gray-500">CGST ({form.items[0]?.taxRate / 2}%):</span><span className="tabular-nums">{formatCurrency(cgst)}</span></div>
                  <div className="flex justify-between w-full max-w-xs"><span className="text-gray-500">SGST ({form.items[0]?.taxRate / 2}%):</span><span className="tabular-nums">{formatCurrency(sgst)}</span></div>
                </>
              ) : (
                <div className="flex justify-between w-full max-w-xs"><span className="text-gray-500">IGST ({form.items[0]?.taxRate}%):</span><span className="tabular-nums">{formatCurrency(igst)}</span></div>
              )}
              <div className="flex justify-between w-full max-w-xs border-t pt-2 mt-2 font-bold text-base"><span>Total:</span><span className="tabular-nums">{formatCurrency(total)}</span></div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary"><Icons.printer size={14} /> Preview</Button>
              <Button onClick={saveInvoice}><Icons.check size={14} /> Save Invoice</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const InvoiceList = ({ invoices, customers, onView }) => {
  const [search, setSearch] = useState("");
  const filtered = invoices.filter(inv => {
    const cust = customers.find(c => c.id === inv.customerId);
    return inv.invoiceNo.includes(search) || cust?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Card title="Invoices" actions={<SearchBar value={search} onChange={setSearch} placeholder="Search invoice..." />}>
      <Table columns={[
        { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-mono font-medium">{r.invoiceNo}</span> },
        { key: "date", label: "Date", render: (r) => formatDate(r.date) },
        { key: "customer", label: "Customer", render: (r) => customers.find(c => c.id === r.customerId)?.name || "—" },
        { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
        { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "active" ? "success" : "danger"}>{r.status}</Badge> },
        { key: "actions", label: "", render: (r) => <Button size="sm" variant="ghost" onClick={() => onView(r)}><Icons.file size={14} /> View</Button> },
      ]} data={filtered} emptyMsg="No invoices yet" />
    </Card>
  );
};

// ─── INVOICE PRINT VIEW ──────────────────────────────────────────────────────
const InvoicePrintView = ({ invoice, company, customer }) => {
  if (!invoice) return null;
  const consignee = customer;
  const buyer = customer;
  const taxableValue = invoice.items.reduce((s, i) => s + i.amount, 0);
  const isInterState = customer?.state !== company.stateCode;

  return (
    <div className="bg-white p-6 text-xs" id="invoice-print">
      <div className="border border-gray-800">
        {/* Header */}
        <div className="text-center py-2 border-b border-gray-800 font-bold text-sm">Tax Invoice</div>
        {/* IRN & Ack */}
        <div className="px-3 py-1 border-b border-gray-800 text-[10px]">
          <div>IRN : {invoice.irn || "—"}</div>
          <div>Ack No. : {invoice.ackNo || "—"}</div>
          <div>Ack Date : {invoice.date ? formatDate(invoice.date) : "—"}</div>
        </div>
        {/* Company + Invoice Details */}
        <div className="grid grid-cols-2 border-b border-gray-800">
          <div className="p-3 border-r border-gray-800">
            <div className="font-bold">{company.name}</div>
            <div>{company.address}</div>
            <div>GSTIN/UIN: {company.gstin}</div>
            <div>State Name : {company.stateName}, Code : {company.stateCode}</div>
            <div>E-Mail : {company.email}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 border-r border-b border-gray-800"><span className="text-gray-500">Invoice No.</span><br /><strong>{invoice.invoiceNo}</strong></div>
            <div className="p-2 border-b border-gray-800"><span className="text-gray-500">Dated</span><br /><strong>{formatDate(invoice.date)}</strong></div>
            <div className="p-2 border-r border-b border-gray-800"><span className="text-gray-500">Delivery Note</span><br />{invoice.deliveryNote || "—"}</div>
            <div className="p-2 border-b border-gray-800"><span className="text-gray-500">Mode/Terms of Payment</span><br />{invoice.paymentTerms || "—"}</div>
            <div className="p-2 border-r border-b border-gray-800"><span className="text-gray-500">Reference No. & Date</span></div>
            <div className="p-2 border-b border-gray-800"><span className="text-gray-500">Other References</span></div>
            <div className="p-2 border-r border-gray-800"><span className="text-gray-500">Buyer's Order No.</span></div>
            <div className="p-2"><span className="text-gray-500">Dated</span></div>
          </div>
        </div>
        {/* Consignee / Buyer */}
        <div className="grid grid-cols-2 border-b border-gray-800">
          <div className="p-3 border-r border-gray-800">
            <div className="text-gray-500 text-[10px]">Consignee (Ship to)</div>
            <div className="font-bold">{consignee?.name}</div>
            <div>{consignee?.address}</div>
            <div>GSTIN/UIN : {consignee?.gstin}</div>
            <div>State Name : {STATES.find(s => s.code === consignee?.state)?.name}, Code : {consignee?.state}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 border-r border-b border-gray-800"><span className="text-gray-500">Dispatch Doc No.</span></div>
            <div className="p-2 border-b border-gray-800"><span className="text-gray-500">Delivery Note Date</span></div>
            <div className="p-2 border-r border-gray-800"><span className="text-gray-500">Dispatched through</span></div>
            <div className="p-2"><span className="text-gray-500">Destination</span></div>
          </div>
        </div>
        <div className="p-3 border-b border-gray-800">
          <div className="text-gray-500 text-[10px]">Buyer (Bill to)</div>
          <div className="font-bold">{buyer?.name}</div>
          <div>{buyer?.address}</div>
          <div>GSTIN/UIN : {buyer?.gstin}</div>
          <div>State Name : {STATES.find(s => s.code === buyer?.state)?.name}, Code : {buyer?.state}</div>
        </div>
        {/* Items Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-50">
              <th className="border-r border-gray-800 p-1.5 text-left w-8">SI No.</th>
              <th className="border-r border-gray-800 p-1.5 text-left">Description of Goods</th>
              <th className="border-r border-gray-800 p-1.5 text-center">HSN/SAC</th>
              <th className="border-r border-gray-800 p-1.5 text-right">Quantity</th>
              <th className="border-r border-gray-800 p-1.5 text-right">Rate (Incl. Tax)</th>
              <th className="border-r border-gray-800 p-1.5 text-right">Rate</th>
              <th className="border-r border-gray-800 p-1.5 text-center">per</th>
              <th className="p-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-800">
                <td className="border-r border-gray-800 p-1.5">{idx + 1}</td>
                <td className="border-r border-gray-800 p-1.5 font-bold">{item.name}</td>
                <td className="border-r border-gray-800 p-1.5 text-center">{item.hsn}</td>
                <td className="border-r border-gray-800 p-1.5 text-right">{item.qty.toFixed(2)} {item.unit}</td>
                <td className="border-r border-gray-800 p-1.5 text-right">{(item.rate * (1 + item.taxRate / 100)).toFixed(2)}</td>
                <td className="border-r border-gray-800 p-1.5 text-right">{item.rate.toFixed(2)}</td>
                <td className="border-r border-gray-800 p-1.5 text-center">{item.unit}</td>
                <td className="p-1.5 text-right font-bold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {/* Tax Rows */}
            {!isInterState ? (
              <>
                <tr className="border-b border-gray-800">
                  <td className="border-r border-gray-800 p-1.5" />
                  <td className="border-r border-gray-800 p-1.5 text-right font-bold" colSpan={5}>CGST</td>
                  <td className="border-r border-gray-800 p-1.5 text-right">{invoice.items[0]?.taxRate / 2} %</td>
                  <td className="p-1.5 text-right font-bold">{formatCurrency(invoice.cgst)}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="border-r border-gray-800 p-1.5" />
                  <td className="border-r border-gray-800 p-1.5 text-right font-bold" colSpan={5}>SGST</td>
                  <td className="border-r border-gray-800 p-1.5 text-right">{invoice.items[0]?.taxRate / 2} %</td>
                  <td className="p-1.5 text-right font-bold">{formatCurrency(invoice.sgst)}</td>
                </tr>
              </>
            ) : (
              <tr className="border-b border-gray-800">
                <td className="border-r border-gray-800 p-1.5" />
                <td className="border-r border-gray-800 p-1.5 text-right font-bold" colSpan={5}>IGST</td>
                <td className="border-r border-gray-800 p-1.5 text-right">{invoice.items[0]?.taxRate} %</td>
                <td className="p-1.5 text-right font-bold">{formatCurrency(invoice.igst)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td className="border-r border-gray-800 p-2" />
              <td className="border-r border-gray-800 p-2 text-right font-bold" colSpan={2}>Total</td>
              <td className="border-r border-gray-800 p-2 text-right font-bold">{invoice.items.reduce((s, i) => s + i.qty, 0).toFixed(2)} {invoice.items[0]?.unit}</td>
              <td className="border-r border-gray-800 p-2" colSpan={3} />
              <td className="p-2 text-right font-bold text-base">₹ {invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        {/* Amount in Words */}
        <div className="px-3 py-2 border-t border-gray-800 text-[10px]">
          <span className="text-gray-500">Amount Chargeable (in words)</span><br />
          <strong>INR {numberToWords(invoice.total)} Only</strong>
        </div>
        {/* Tax Breakdown Table */}
        <div className="border-t border-gray-800">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-50">
                <th className="border-r border-gray-800 p-1.5">HSN/SAC</th>
                <th className="border-r border-gray-800 p-1.5 text-right">Taxable Value</th>
                {!isInterState ? (
                  <>
                    <th className="border-r border-gray-800 p-1.5 text-center" colSpan={2}>Central Tax</th>
                    <th className="border-r border-gray-800 p-1.5 text-center" colSpan={2}>State Tax</th>
                  </>
                ) : (
                  <th className="border-r border-gray-800 p-1.5 text-center" colSpan={2}>Integrated Tax</th>
                )}
                <th className="p-1.5 text-right">Total Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="border-r border-gray-800 p-1.5">{invoice.items[0]?.hsn}</td>
                <td className="border-r border-gray-800 p-1.5 text-right">{formatCurrency(taxableValue)}</td>
                {!isInterState ? (
                  <>
                    <td className="border-r border-gray-800 p-1.5 text-right">{invoice.items[0]?.taxRate / 2}%</td>
                    <td className="border-r border-gray-800 p-1.5 text-right">{formatCurrency(invoice.cgst)}</td>
                    <td className="border-r border-gray-800 p-1.5 text-right">{invoice.items[0]?.taxRate / 2}%</td>
                    <td className="border-r border-gray-800 p-1.5 text-right">{formatCurrency(invoice.sgst)}</td>
                  </>
                ) : (
                  <>
                    <td className="border-r border-gray-800 p-1.5 text-right">{invoice.items[0]?.taxRate}%</td>
                    <td className="border-r border-gray-800 p-1.5 text-right">{formatCurrency(invoice.igst)}</td>
                  </>
                )}
                <td className="p-1.5 text-right font-bold">{formatCurrency(invoice.totalTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="grid grid-cols-2 border-t border-gray-800">
          <div className="p-3 border-r border-gray-800 text-[10px]">
            <div className="font-bold mb-1">Declaration</div>
            <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
          </div>
          <div className="p-3 text-right text-[10px]">
            <div className="font-bold">for {company.name}</div>
            <div className="mt-8">Authorised Signatory</div>
          </div>
        </div>
        <div className="text-center py-1 border-t border-gray-800 text-[10px] text-gray-500">This is a Computer Generated Invoice</div>
      </div>
    </div>
  );
};



