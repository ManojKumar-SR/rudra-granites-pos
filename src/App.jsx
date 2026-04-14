import { useState, useCallback } from "react";


import { generateId, today } from "./utils/helpers";
import { formatCurrency, formatDate , numberToWords} from "./utils/formatters";
import { validateGSTIN } from "./utils/validators";
import {
  PRODUCT_CATEGORIES,
  UNITS,
  STATES,
  TRANSPORT_MODES,
  COMPANY,
} from "./constants";

import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSPORTERS,
} from "./data/seeds";

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

import { Icons } from "./components/ui/Icons";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Select } from "./components/ui/Select";
import { Card } from "./components/ui/Card";
import { Stat } from "./components/ui/Stat";
import { Table } from "./components/ui/Table";
import { Modal } from "./components/ui/Modal";
import { Tabs } from "./components/ui/Tabs";
import { EmptyState } from "./components/ui/EmptyState";
import { SearchBar } from "./components/ui/SearchBar";

//MODULES
import { Dashboard } from "./modules/DashBoard";
import { DispatchModule } from "./modules/DispatchModule";
import { CustomerModule } from "./modules/CustomerModule";
import { TransporterModule } from "./modules/TransporterModule";
import { ReportsModule } from "./modules/ReportsModule";
import { GSTModule } from "./modules/GSTModule";
import { AdminModule } from "./modules/AdminModules";
import { PurchaseModule } from "./modules/PurchaseModule";
import { InventoryModule } from "./modules/InventoryModule";
import { BillingModule } from "./modules/BillingModule";
import { EWayModule } from "./modules/EWayModule";
import { EInvoiceModule } from "./modules/EInvoiceModule";







// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Icons.home },
  { key: "billing", label: "Billing", icon: Icons.receipt },
  { key: "inventory", label: "Inventory", icon: Icons.box },
  { key: "purchase", label: "Purchase", icon: Icons.cart },
  { key: "gst", label: "GST & Tax", icon: Icons.percent },
  { key: "eway", label: "E-Way Bill", icon: Icons.truck },
  { key: "einvoice", label: "E-Invoice", icon: Icons.qr },
  { key: "dispatch", label: "Dispatch", icon: Icons.map },
  { key: "customers", label: "Parties", icon: Icons.users },
  { key: "transporters", label: "Transporters", icon: Icons.truck },
  { key: "reports", label: "Reports", icon: Icons.chart },
  { key: "admin", label: "Admin", icon: Icons.settings },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [transporters, setTransporters] = useState(INITIAL_TRANSPORTERS);
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [eWayBills, setEWayBills] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [gspConfig, setGspConfig] = useState({
    apiKey: "", apiSecret: "", gstin: COMPANY.gstin,
    ewbUsername: "", ewbPassword: "",
    environment: "sandbox", backendUrl: "",
  });

  const navigate = useCallback((p) => { setPage(p); setSidebarOpen(false); }, []);

  const currentNav = NAV_ITEMS.find(n => n.key === page);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard invoices={invoices} products={products} purchases={purchases} eWayBills={eWayBills} />;
      case "billing": return <BillingModule products={products} setProducts={setProducts} customers={customers} invoices={invoices} setInvoices={setInvoices} company={COMPANY} />;
      case "inventory": return <InventoryModule products={products} setProducts={setProducts} />;
      case "purchase": return <PurchaseModule products={products} setProducts={setProducts} suppliers={suppliers} purchases={purchases} setPurchases={setPurchases} />;
      case "gst": return <GSTModule products={products} invoices={invoices} company={COMPANY} />;
      case "eway": return <EWayModule invoices={invoices} customers={customers} transporters={transporters} setInvoices={setInvoices} />;
      case "einvoice": return <EInvoiceModule invoices={invoices} setInvoices={setInvoices} company={COMPANY} customers={customers} />;
      case "dispatch": return <DispatchModule invoices={invoices} dispatches={dispatches} setDispatches={setDispatches} />;
      case "customers": return <CustomerModule customers={customers} setCustomers={setCustomers} suppliers={suppliers} setSuppliers={setSuppliers} invoices={invoices} />;
      case "transporters": return <TransporterModule transporters={transporters} setTransporters={setTransporters} />;
      case "reports": return <ReportsModule invoices={invoices} products={products} purchases={purchases} eWayBills={eWayBills} />;
      case "admin": return <AdminModule gspConfig={gspConfig} setGspConfig={setGspConfig} />;
      default: return <Dashboard invoices={invoices} products={products} purchases={purchases} eWayBills={eWayBills} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">R</div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">Rudra Granites</div>
            <div className="text-[10px] text-gray-400 truncate">POS System</div>
          </div>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const IconComp = item.icon;
            const isActive = page === item.key;
            return (
              <button key={item.key} onClick={() => navigate(item.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <IconComp size={16} />
                <span className="truncate">{item.label}</span>
                {item.key === "inventory" && lowStockCount > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{lowStockCount}</span>}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-gray-100 text-[10px] text-gray-400">
          <div>GSTIN: {COMPANY.gstin}</div>
          <div className="truncate">{COMPANY.stateName}</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}><Icons.menu size={20} /></button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{currentNav?.label || "Dashboard"}</h1>
              <p className="text-xs text-gray-400">{COMPANY.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <button onClick={() => navigate("inventory")} className="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100">
                <Icons.alert size={12} /> {lowStockCount} Low Stock
              </button>
            )}
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">A</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{renderPage()}</main>
      </div>
    </div>
  );
}
