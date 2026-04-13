// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 11: ADMIN CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { formatDate } from "../utils/formatters";
import { COMPANY } from "../constants";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Icons } from "../components/ui/Icons";

export const AdminModule = ({ gspConfig, setGspConfig }) => {
  const [tab, setTab] = useState("users");
  const [users] = useState([
    { id: "u1", name: "Admin", role: "admin", email: "admin@rudragranites.com", branch: "Main", status: "active", lastLogin: "2026-04-12T10:30:00" },
    { id: "u2", name: "Billing Staff", role: "billing", email: "billing@rudragranites.com", branch: "Main", status: "active", lastLogin: "2026-04-12T09:15:00" },
    { id: "u3", name: "Inventory Manager", role: "inventory", email: "inventory@rudragranites.com", branch: "Yard", status: "active", lastLogin: "2026-04-11T16:45:00" },
  ]);
  const [auditLogs] = useState([
    { id: "a1", timestamp: "2026-04-12T10:30:00", user: "Admin", action: "Invoice Created", details: "Invoice #4959 — ₹96,288.00", module: "Billing" },
    { id: "a2", timestamp: "2026-04-12T09:45:00", user: "Inventory Manager", action: "Stock Adjusted", details: "GRANITE SLAB -50 sqf (Damage)", module: "Inventory" },
    { id: "a3", timestamp: "2026-04-11T16:00:00", user: "Billing Staff", action: "E-Way Bill Generated", details: "EWB via MasterIndia GSP", module: "E-Way" },
  ]);

  const [gspForm, setGspForm] = useState(gspConfig);
  const gspSet = (k, v) => setGspForm(p => ({ ...p, [k]: v }));
  const saveGspConfig = () => { setGspConfig(gspForm); alert("GSP configuration saved!"); };

  return (
    <div>
      <Tabs tabs={[
        { key: "users", label: "Users & Roles" },
        { key: "gsp", label: "GSP Settings" },
        { key: "audit", label: "Audit Logs" },
        { key: "settings", label: "Settings" },
      ]} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "users" && (
          <Card title="User Management" actions={<Button size="sm"><Icons.plus size={14} /> Add User</Button>}>
            <Table columns={[
              { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
              { key: "role", label: "Role", render: (r) => <Badge variant={r.role === "admin" ? "info" : "default"}>{r.role}</Badge> },
              { key: "email", label: "Email" },
              { key: "branch", label: "Branch" },
              { key: "status", label: "Status", render: (r) => <Badge variant="success">{r.status}</Badge> },
              { key: "lastLogin", label: "Last Login", render: (r) => formatDate(r.lastLogin) },
            ]} data={users} />
          </Card>
        )}
        {tab === "gsp" && (
          <div className="space-y-4">
            <Card title="MasterIndia GSP Configuration">
              <div className="p-4 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                  <strong>MasterIndia GSP</strong> is used for E-Way Bill and E-Invoice API integration.
                  Your backend developer will use these credentials to authenticate with the MasterIndia API.
                  The frontend sends requests to your backend, which proxies them to MasterIndia.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="GSP Username / Client ID *" value={gspForm.apiKey} onChange={e => gspSet("apiKey", e.target.value)} placeholder="Your MasterIndia Client ID" />
                  <Input label="GSP Secret Key *" type="password" value={gspForm.apiSecret} onChange={e => gspSet("apiSecret", e.target.value)} placeholder="Your MasterIndia Secret" />
                  <Input label="Business GSTIN *" value={gspForm.gstin} onChange={e => gspSet("gstin", e.target.value.toUpperCase())} placeholder={COMPANY.gstin} maxLength={15} />
                  <Input label="E-Way Bill Username" value={gspForm.ewbUsername} onChange={e => gspSet("ewbUsername", e.target.value)} placeholder="EWB portal username" />
                  <Input label="E-Way Bill Password" type="password" value={gspForm.ewbPassword} onChange={e => gspSet("ewbPassword", e.target.value)} placeholder="EWB portal password" />
                  <Select label="Environment" options={[{ value: "sandbox", label: "Sandbox (Testing)" }, { value: "production", label: "Production (Live)" }]} value={gspForm.environment} onChange={e => gspSet("environment", e.target.value)} />
                  <Input label="Backend API Base URL" value={gspForm.backendUrl} onChange={e => gspSet("backendUrl", e.target.value)} placeholder="https://your-api.com/api/v1" className="sm:col-span-2" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-400">
                    Note: Credentials are stored locally. In production, these should be securely managed by the backend.
                  </div>
                  <Button onClick={saveGspConfig}><Icons.check size={14} /> Save Configuration</Button>
                </div>
              </div>
            </Card>

            <Card title="API Endpoints Reference (for Backend Developer)">
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold text-gray-700">Authentication</h4>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /ewaybillapi/v1.03/authenticate</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /eInvoice/v1.03/authenticate</div>

                  <h4 className="font-semibold text-gray-700 pt-3">E-Way Bill APIs</h4>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /ewaybillapi/v1.03/ewayapi/genewaybill — Generate</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /ewaybillapi/v1.03/ewayapi/canewb — Cancel</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /ewaybillapi/v1.03/ewayapi/updatevehicle — Update Vehicle (Part-B)</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /ewaybillapi/v1.03/ewayapi/extendvalidity — Extend Validity</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">GET /ewaybillapi/v1.03/ewayapi/getewaybill?ewbNo= — Fetch Details</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /ewaybillapi/v1.03/ewayapi/ConEWBill — Consolidated EWB</div>

                  <h4 className="font-semibold text-gray-700 pt-3">E-Invoice APIs</h4>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /eInvoice/v1.03/eInvoice/generate — Generate IRN</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /eInvoice/v1.03/eInvoice/cancel — Cancel IRN</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">GET /eInvoice/v1.03/eInvoice/irn/{"{irn}"} — Get IRN Details</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">POST /eInvoice/v1.03/eInvoice/generateEwayBill — Generate EWB from IRN</div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">GET /eInvoice/v1.03/eInvoice/ewaybilldetails/{"{irn}"} — Get EWB by IRN</div>
                </div>
              </div>
            </Card>
          </div>
        )}
        {tab === "audit" && (
          <Card title="Audit Trail">
            <Table columns={[
              { key: "timestamp", label: "Time", render: (r) => new Date(r.timestamp).toLocaleString("en-IN") },
              { key: "user", label: "User" },
              { key: "module", label: "Module", render: (r) => <Badge>{r.module}</Badge> },
              { key: "action", label: "Action", render: (r) => <span className="font-medium">{r.action}</span> },
              { key: "details", label: "Details" },
            ]} data={auditLogs} />
          </Card>
        )}
        {tab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Company Details">
              <div className="p-4 space-y-3">
                <Input label="Company Name" value={COMPANY.name} readOnly />
                <Input label="GSTIN" value={COMPANY.gstin} readOnly />
                <Input label="Address" value={COMPANY.address} readOnly />
                <Input label="Email" value={COMPANY.email} readOnly />
                <Input label="State" value={`${COMPANY.stateName} (${COMPANY.stateCode})`} readOnly />
              </div>
            </Card>
            <Card title="System Settings">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div><div className="text-sm font-medium">Auto Invoice Number</div><div className="text-xs text-gray-400">Automatically generate sequential invoice numbers</div></div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div><div className="text-sm font-medium">Low Stock Alerts</div><div className="text-xs text-gray-400">Notify when stock falls below minimum</div></div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div><div className="text-sm font-medium">E-Invoice Compliance</div><div className="text-xs text-gray-400">Auto-generate IRN and QR code</div></div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><div className="text-sm font-medium">Negative Stock Prevention</div><div className="text-xs text-gray-400">Block billing when stock is insufficient</div></div>
                  <Badge variant="success">Enabled</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
