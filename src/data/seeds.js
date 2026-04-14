export const INITIAL_PRODUCTS = [
  { id: "p1", name: "GRANITE SLAB", category: "Granite", hsn: "25161100", unit: "sqf", thickness: "18mm", size: "8x4", rate: 85, taxRate: 18, stock: 5000, minStock: 500, warehouse: "Main" },
  { id: "p2", name: "MARBLE SLAB", category: "Marble", hsn: "25151100", unit: "sqf", thickness: "16mm", size: "7x4", rate: 120, taxRate: 18, stock: 3000, minStock: 300, warehouse: "Main" },
  { id: "p3", name: "CERAMIC TILES", category: "Tiles", hsn: "69072100", unit: "piece", thickness: "8mm", size: "2x2", rate: 45, taxRate: 18, stock: 10000, minStock: 1000, warehouse: "Main" },
  { id: "p4", name: "SANDSTONE SLAB", category: "Stone", hsn: "25161200", unit: "slab", thickness: "20mm", size: "6x3", rate: 950, taxRate: 18, stock: 200, minStock: 20, warehouse: "Yard" },
];

export const INITIAL_CUSTOMERS = [
  { id: "c1", name: "LOBI DHAS", mobile: "9876543210", gstin: "33AFZPL5401L1Z2", address: "PULLUVILAI, VEEYANOOR", city: "VEEYANOOR", pin: 629177, state: "33", creditLimit: 500000, outstanding: 0, addresses: [{ label: "Primary", address: "PULLUVILAI, VEEYANOOR" }] },
  { id: "c2", name: "KUMAR TRADERS", mobile: "9876543211", gstin: "33BXYPS1234A1Z5", address: "NAGERCOIL", city: "NAGERCOIL", pin: 629001, state: "33", creditLimit: 300000, outstanding: 50000, addresses: [{ label: "Primary", address: "NAGERCOIL" }] },
];

export const INITIAL_SUPPLIERS = [
  { id: "s1", name: "STONE WORLD SUPPLIERS", mobile: "9123456780", gstin: "29AABCS1234F1Z5", address: "BANGALORE", state: "29", outstanding: 0 },
  { id: "s2", name: "MARBLE HOUSE", mobile: "9123456781", gstin: "33AABCM5678G1Z3", address: "MADURAI", state: "33", outstanding: 25000 },
];

export const INITIAL_TRANSPORTERS = [
  { id: "t1", transId: "29DPZPS4403C1ZF", transName: "ABC Transport Ltd", contact: "9876543210", email: "contact@abctransport.in", address: "Transport Hub, Bangalore", state: "29" },
  { id: "t2", transId: "33AAKPT7890M1Z5", transName: "Rapid Logistics Pvt Ltd", contact: "9123456789", email: "info@rapidlogistics.in", address: "Logistics Park, Chennai", state: "33" },
  { id: "t3", transId: "27AAECT1234H1Z0", transName: "National Transport Co", contact: "9988776655", email: "ops@nationaltransport.in", address: "Transport Yard, Mumbai", state: "27" },
];
