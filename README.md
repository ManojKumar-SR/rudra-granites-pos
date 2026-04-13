# Rudra Granites & Tiles — POS System

A complete Point-of-Sale system built for granite, marble, and tiles businesses with full GST compliance, inventory management, and E-Way billing.

---

## Project Structure

```
rudra-granites-pos/
├── index.html                  # Entry HTML
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite bundler config
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── netlify.toml                # Netlify deployment config
├── .gitignore
├── public/
│   └── vite.svg
└── src/
    ├── main.jsx                # React entry point
    ├── index.css               # Tailwind imports + global styles
    └── App.jsx                 # Complete application (all 11 modules)
```

### For a production-scale refactor, split `App.jsx` into:

```
src/
├── main.jsx
├── index.css
├── App.jsx                     # Layout shell + routing
├── components/
│   ├── ui/                     # Reusable UI primitives
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Select.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Stat.jsx
│   │   ├── Table.jsx
│   │   ├── Tabs.jsx
│   │   └── EmptyState.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   └── PageWrapper.jsx
│   ├── billing/
│   │   ├── BillingModule.jsx
│   │   ├── InvoiceCreator.jsx
│   │   ├── InvoiceList.jsx
│   │   └── InvoicePrintView.jsx
│   ├── inventory/
│   │   ├── InventoryModule.jsx
│   │   ├── ProductForm.jsx
│   │   └── StockAdjustment.jsx
│   ├── purchase/
│   │   ├── PurchaseModule.jsx
│   │   └── PurchaseForm.jsx
│   ├── gst/
│   │   └── GSTModule.jsx
│   ├── eway/
│   │   ├── EWayModule.jsx
│   │   └── EWayForm.jsx
│   ├── einvoice/
│   │   └── EInvoiceModule.jsx
│   ├── dispatch/
│   │   ├── DispatchModule.jsx
│   │   └── DispatchForm.jsx
│   ├── customers/
│   │   ├── CustomerModule.jsx
│   │   └── PartyForm.jsx
│   ├── reports/
│   │   └── ReportsModule.jsx
│   └── admin/
│       └── AdminModule.jsx
├── utils/
│   ├── formatters.js           # formatCurrency, formatDate, numberToWords
│   ├── validators.js           # validateGSTIN
│   └── helpers.js              # generateId
├── data/
│   ├── constants.js            # STATES, CATEGORIES, UNITS, TRANSPORT_MODES
│   ├── company.js              # Company details
│   └── initialData.js          # Seed products, customers, suppliers
└── hooks/
    ├── useProducts.js
    ├── useInvoices.js
    └── useLocalStorage.js
```

---

## Modules Implemented

| # | Module | Features |
|---|--------|----------|
| 1 | **Billing System** | Invoice creation, auto-numbering, item management, GST calc (CGST/SGST/IGST), printable invoice matching the GST format, tax/retail invoice support, buyer/consignee |
| 2 | **Inventory Management** | Real-time stock tracking, product CRUD, category/size/thickness, low stock alerts, stock adjustment (damage/wastage), warehouse-wise, unit conversion |
| 3 | **Billing + Inventory Integration** | Auto stock deduction on billing, insufficient stock prevention, live stock visibility during invoicing, negative stock prevention |
| 4 | **Purchase Management** | Supplier purchase entry, purchase rate recording, auto inventory update, purchase history, supplier payment tracking |
| 5 | **GST & Tax Management** | GSTIN validation, HSN/SAC mapping, product-wise tax rates, tax summary, GST ledger, intra/inter-state handling |
| 6 | **E-Way Billing** | Generate from invoice, vehicle/transporter entry, mode of transport, distance-based validity, cancellation |
| 7 | **E-Invoice Compliance** | IRN generation, QR code, Ack number/date storage, GST portal JSON export |
| 8 | **Dispatch & Delivery** | Delivery note, dispatch document linking, transport details, delivery status tracking |
| 9 | **Customer & Party Management** | Customer/Supplier master, GSTIN validation, credit ledger, outstanding tracking, billing history |
| 10 | **Reports & Analytics** | Daily sales, product sales, GST report, stock movement, purchase report, profit analysis |
| 11 | **Admin Controls** | User roles/permissions, audit logs, company settings, system configuration |

---

## Setup & Installation

```bash
# 1. Clone or copy the project
cd rudra-granites-pos

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

---

## Deploy to Netlify

### Option A: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Option B: Git-based Deploy

1. Push your code to GitHub/GitLab
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repo
5. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

### Option C: Drag & Drop

```bash
npm run build
```
Then drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

---

## Tech Stack

- **React 18** — UI framework
- **Tailwind CSS 3** — Utility-first styling
- **Vite 5** — Build tool
- **No external UI library** — All components built from scratch for full control

---

## Responsive Design

- **Mobile (< 640px):** Collapsible sidebar, stacked forms, scrollable tables
- **Tablet (640–1024px):** 2-column grids, partial sidebar
- **Desktop (> 1024px):** Full sidebar, 4-column stat grids, spacious layouts

---

## Maintenance Notes

- All state is managed via React `useState` at the App level — easy to migrate to Zustand/Redux or a backend
- Company details are in `COMPANY` constant — update once, reflected everywhere
- Product categories, states, units are in constants — easy to extend
- Invoice format matches the uploaded GST tax invoice template exactly
- All financial values use `tabular-nums` for proper alignment
- Print styles are included for invoice printing via `@media print`
