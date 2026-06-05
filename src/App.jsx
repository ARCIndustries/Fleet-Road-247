import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  clients: "fleetcrm_clients",
  incidents: "fleetcrm_incidents",
  contractors: "fleetcrm_contractors",
  invoices: "fleetcrm_invoices",
};

const initialClients = [
  { id: "c1", company: "Midwest Haulers LLC", contact: "James Porter", phone: "734-555-0192", vehicles: 8, type: "53ft", status: "active" },
  { id: "c2", company: "Swift Cargo Co", contact: "Maria Santos", phone: "313-555-0847", vehicles: 4, type: "Sprinter", status: "active" },
];
const initialIncidents = [
  { id: "i1", clientId: "c1", date: "2026-05-28", type: "Tire Blowout", location: "I-94 MM 42", contractorId: "k1", status: "resolved", notes: "Replaced rear driver tire", amount: 280 },
  { id: "i2", clientId: "c2", date: "2026-06-01", type: "Engine Failure", location: "US-23 Southbound", contractorId: "k2", status: "in-progress", notes: "Tow dispatched, awaiting diagnosis", amount: 450 },
];
const initialContractors = [
  { id: "k1", name: "Detroit Road Rescue", phone: "313-555-0011", region: "Wayne County", specialty: "Heavy Tow", rating: 5, jobs: 14, notes: "Reliable, 24/7" },
  { id: "k2", name: "Ann Arbor Fleet Service", phone: "734-555-0322", region: "Washtenaw County", specialty: "Engine/Mechanical", rating: 4, jobs: 7, notes: "Good but slow on nights" },
];
const initialInvoices = [
  { id: "inv1", clientId: "c1", incidentId: "i1", date: "2026-05-29", amount: 280, status: "paid", dueDate: "2026-06-12" },
  { id: "inv2", clientId: "c2", incidentId: "i2", date: "2026-06-02", amount: 450, status: "pending", dueDate: "2026-06-16" },
];

function useStorage(key, initial) {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  const save = (val) => {
    setData(val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  };
  return [data, save];
}

const TABS = ["Dashboard", "Clients", "Incidents", "Contractors", "Invoices"];

const statusColor = (s) => ({
  active: "#00e5a0", resolved: "#00e5a0", paid: "#00e5a0",
  pending: "#f5a623", "in-progress": "#f5a623",
  inactive: "#ff4f4f", overdue: "#ff4f4f",
}[s] || "#aaa");

const StarRating = ({ value, onChange }) => (
  <span style={{ cursor: onChange ? "pointer" : "default" }}>
    {[1,2,3,4,5].map(n => (
      <span key={n} onClick={() => onChange && onChange(n)}
        style={{ color: n <= value ? "#f5a623" : "#444", fontSize: 18, marginRight: 2 }}>★</span>
    ))}
  </span>
);

function WeeklySummary({ clients, incidents, invoices }) {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const recentIncidents = incidents.filter(i => new Date(i.date) >= weekAgo);
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const revenue = invoices.filter(i => i.status === "paid").reduce((a, b) => a + b.amount, 0);
  const openIncidents = incidents.filter(i => i.status === "in-progress");

  return (
    <div style={{ background: "linear-gradient(135deg,#1a1f2e,#0f1318)", border: "1px solid #f5a623", borderRadius: 4, padding: "20px 24px", marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 11, letterSpacing: 3, color: "#f5a623", fontFamily: "monospace" }}>WEEKLY SUMMARY</span>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>— AUTO GENERATED</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "ACTIVE CLIENTS", val: clients.filter(c=>c.status==="active").length, color: "#00e5a0" },
          { label: "INCIDENTS THIS WEEK", val: recentIncidents.length, color: "#f5a623" },
          { label: "OPEN JOBS", val: openIncidents.length, color: openIncidents.length > 0 ? "#ff4f4f" : "#00e5a0" },
          { label: "PENDING INVOICES", val: `$${pendingInvoices.reduce((a,b)=>a+b.amount,0).toLocaleString()}`, color: "#f5a623" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", background: "#0a0d12", padding: "14px 8px", borderRadius: 4, border: "1px solid #1e2530" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {openIncidents.length > 0 && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "#ff4f4f18", border: "1px solid #ff4f4f44", borderRadius: 4 }}>
          <span style={{ fontSize: 11, color: "#ff4f4f", letterSpacing: 2 }}>⚠ ACTION NEEDED: </span>
          <span style={{ fontSize: 12, color: "#ccc" }}>{openIncidents.length} incident(s) still in progress — check contractor status</span>
        </div>
      )}
    </div>
  );
}

function ClientsTab({ clients, setClients, incidents }) {
  const [form, setForm] = useState(null);
  const blank = { company: "", contact: "", phone: "", vehicles: "", type: "53ft", status: "active" };

  const save = () => {
    if (!form.company) return;
    if (form.id) setClients(clients.map(c => c.id === form.id ? form : c));
    else setClients([...clients, { ...form, id: "c" + Date.now(), vehicles: Number(form.vehicles) }]);
    setForm(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 11, letterSpacing: 3, color: "#f5a623" }}>CLIENT ROSTER</span>
        <button onClick={() => setForm(blank)} style={btnStyle("#f5a623", "#0a0d12")}>+ ADD CLIENT</button>
      </div>
      {form && (
        <Modal title={form.id ? "Edit Client" : "New Client"} onClose={() => setForm(null)}>
          {["company","contact","phone","vehicles"].map(f => (
            <Field key={f} label={f.toUpperCase()} value={form[f]} onChange={v => setForm({...form,[f]:v})} />
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>TYPE</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inputStyle}>
              {["53ft","Sprinter","Cargo Van","Mixed"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>STATUS</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <button onClick={save} style={btnStyle("#f5a623","#0a0d12")}>SAVE</button>
        </Modal>
      )}
      <table style={tableStyle}>
        <thead><tr>{["Company","Contact","Phone","Vehicles","Type","Status","Incidents",""].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} style={{ borderBottom: "1px solid #1a2030" }}>
              <td style={tdStyle}><strong style={{ color: "#e8dcc8" }}>{c.company}</strong></td>
              <td style={tdStyle}>{c.contact}</td>
              <td style={tdStyle} ><span style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>{c.phone}</span></td>
              <td style={tdStyle}><span style={{ color: "#f5a623", fontWeight: 700 }}>{c.vehicles}</span></td>
              <td style={tdStyle}><span style={{ fontSize: 11, background: "#1a2030", padding: "2px 8px", borderRadius: 2 }}>{c.type}</span></td>
              <td style={tdStyle}><Badge status={c.status} /></td>
              <td style={tdStyle}>{incidents.filter(i=>i.clientId===c.id).length}</td>
              <td style={tdStyle}><button onClick={()=>setForm(c)} style={btnStyle("#333","#e8dcc8",true)}>EDIT</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IncidentsTab({ incidents, setIncidents, clients, contractors }) {
  const [form, setForm] = useState(null);
  const blank = { clientId: clients[0]?.id||"", date: new Date().toISOString().slice(0,10), type: "Tire Blowout", location: "", contractorId: contractors[0]?.id||"", status: "in-progress", notes: "", amount: "" };

  const save = () => {
    if (!form.clientId) return;
    if (form.id) setIncidents(incidents.map(i=>i.id===form.id?form:i));
    else setIncidents([...incidents,{...form,id:"i"+Date.now(),amount:Number(form.amount)}]);
    setForm(null);
  };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <span style={{ fontSize:11,letterSpacing:3,color:"#f5a623" }}>INCIDENT LOG</span>
        <button onClick={()=>setForm(blank)} style={btnStyle("#f5a623","#0a0d12")}>+ LOG INCIDENT</button>
      </div>
      {form && (
        <Modal title={form.id?"Edit Incident":"New Incident"} onClose={()=>setForm(null)}>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>CLIENT</label>
            <select value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value})} style={inputStyle}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}
            </select>
          </div>
          <Field label="DATE" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>INCIDENT TYPE</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inputStyle}>
              {["Tire Blowout","Engine Failure","Fuel Out","Lockout","Accident","Electrical","Brake Issue","Other"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <Field label="LOCATION" value={form.location} onChange={v=>setForm({...form,location:v})}/>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>CONTRACTOR</label>
            <select value={form.contractorId} onChange={e=>setForm({...form,contractorId:e.target.value})} style={inputStyle}>
              {contractors.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>STATUS</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle}>
              <option value="in-progress">In Progress</option><option value="resolved">Resolved</option>
            </select>
          </div>
          <Field label="AMOUNT ($)" value={form.amount} onChange={v=>setForm({...form,amount:v})} type="number"/>
          <Field label="NOTES" value={form.notes} onChange={v=>setForm({...form,notes:v})} textarea/>
          <button onClick={save} style={btnStyle("#f5a623","#0a0d12")}>SAVE</button>
        </Modal>
      )}
      <table style={tableStyle}>
        <thead><tr>{["Date","Client","Type","Location","Contractor","Status","Amount",""].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {incidents.sort((a,b)=>b.date.localeCompare(a.date)).map(inc=>{
            const client = clients.find(c=>c.id===inc.clientId);
            const contractor = contractors.find(k=>k.id===inc.contractorId);
            return (
              <tr key={inc.id} style={{ borderBottom:"1px solid #1a2030" }}>
                <td style={tdStyle}><span style={{ fontFamily:"monospace",fontSize:12,color:"#888" }}>{inc.date}</span></td>
                <td style={tdStyle}><strong style={{ color:"#e8dcc8" }}>{client?.company||"—"}</strong></td>
                <td style={tdStyle}>{inc.type}</td>
                <td style={{...tdStyle,fontSize:12,color:"#888"}}>{inc.location}</td>
                <td style={tdStyle}>{contractor?.name||"—"}</td>
                <td style={tdStyle}><Badge status={inc.status}/></td>
                <td style={tdStyle}><span style={{ color:"#00e5a0",fontWeight:700 }}>${inc.amount}</span></td>
                <td style={tdStyle}><button onClick={()=>setForm(inc)} style={btnStyle("#333","#e8dcc8",true)}>EDIT</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ContractorsTab({ contractors, setContractors }) {
  const [form, setForm] = useState(null);
  const blank = { name:"",phone:"",region:"",specialty:"Heavy Tow",rating:5,jobs:0,notes:"" };

  const save = () => {
    if (!form.name) return;
    if (form.id) setContractors(contractors.map(k=>k.id===form.id?form:k));
    else setContractors([...contractors,{...form,id:"k"+Date.now(),jobs:Number(form.jobs)}]);
    setForm(null);
  };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <span style={{ fontSize:11,letterSpacing:3,color:"#f5a623" }}>CONTRACTOR NETWORK</span>
        <button onClick={()=>setForm(blank)} style={btnStyle("#f5a623","#0a0d12")}>+ ADD CONTRACTOR</button>
      </div>
      {form && (
        <Modal title={form.id?"Edit Contractor":"New Contractor"} onClose={()=>setForm(null)}>
          {["name","phone","region"].map(f=>(<Field key={f} label={f.toUpperCase()} value={form[f]} onChange={v=>setForm({...form,[f]:v})}/>))}
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>SPECIALTY</label>
            <select value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})} style={inputStyle}>
              {["Heavy Tow","Light Tow","Engine/Mechanical","Tire","Fuel","Electrical","Lockout","General"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>RATING</label>
            <StarRating value={form.rating} onChange={v=>setForm({...form,rating:v})}/>
          </div>
          <Field label="NOTES" value={form.notes} onChange={v=>setForm({...form,notes:v})} textarea/>
          <button onClick={save} style={btnStyle("#f5a623","#0a0d12")}>SAVE</button>
        </Modal>
      )}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
        {contractors.map(k=>(
          <div key={k.id} style={{ background:"#0f1318",border:"1px solid #1e2530",borderRadius:4,padding:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
              <div>
                <div style={{ fontSize:15,fontWeight:700,color:"#e8dcc8",marginBottom:4 }}>{k.name}</div>
                <div style={{ fontSize:11,color:"#888",letterSpacing:1 }}>{k.region}</div>
              </div>
              <button onClick={()=>setForm(k)} style={btnStyle("#1e2530","#e8dcc8",true)}>EDIT</button>
            </div>
            <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
              <span style={{ fontSize:11,background:"#1a2030",padding:"2px 8px",borderRadius:2,color:"#aaa" }}>{k.specialty}</span>
              <span style={{ fontSize:11,background:"#1a2030",padding:"2px 8px",borderRadius:2,color:"#f5a623" }}>{k.jobs} jobs</span>
            </div>
            <StarRating value={k.rating}/>
            <div style={{ fontSize:12,color:"#888",fontFamily:"monospace",marginTop:8 }}>{k.phone}</div>
            {k.notes && <div style={{ fontSize:12,color:"#556",marginTop:8,fontStyle:"italic" }}>{k.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesTab({ invoices, setInvoices, clients, incidents }) {
  const [form, setForm] = useState(null);
  const [printInv, setPrintInv] = useState(null);
  const blank = { clientId:clients[0]?.id||"", incidentId:"", date:new Date().toISOString().slice(0,10), dueDate:"", amount:"", status:"pending" };

  const save = () => {
    if (!form.clientId) return;
    if (form.id) setInvoices(invoices.map(i=>i.id===form.id?form:i));
    else setInvoices([...invoices,{...form,id:"inv"+Date.now(),amount:Number(form.amount)}]);
    setForm(null);
  };

  const totalPaid = invoices.filter(i=>i.status==="paid").reduce((a,b)=>a+b.amount,0);
  const totalPending = invoices.filter(i=>i.status==="pending").reduce((a,b)=>a+b.amount,0);

  return (
    <div>
      {printInv && <PrintInvoice invoice={printInv} clients={clients} incidents={incidents} onClose={()=>setPrintInv(null)}/>}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div style={{ display:"flex",gap:20,alignItems:"center" }}>
          <span style={{ fontSize:11,letterSpacing:3,color:"#f5a623" }}>INVOICES</span>
          <span style={{ fontSize:12,color:"#00e5a0" }}>Collected: <strong>${totalPaid.toLocaleString()}</strong></span>
          <span style={{ fontSize:12,color:"#f5a623" }}>Pending: <strong>${totalPending.toLocaleString()}</strong></span>
        </div>
        <button onClick={()=>setForm(blank)} style={btnStyle("#f5a623","#0a0d12")}>+ NEW INVOICE</button>
      </div>
      {form && (
        <Modal title={form.id?"Edit Invoice":"New Invoice"} onClose={()=>setForm(null)}>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>CLIENT</label>
            <select value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value})} style={inputStyle}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}
            </select>
          </div>
          <Field label="INVOICE DATE" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/>
          <Field label="DUE DATE" value={form.dueDate} onChange={v=>setForm({...form,dueDate:v})} type="date"/>
          <Field label="AMOUNT ($)" value={form.amount} onChange={v=>setForm({...form,amount:v})} type="number"/>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>STATUS</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle}>
              <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
            </select>
          </div>
          <button onClick={save} style={btnStyle("#f5a623","#0a0d12")}>SAVE</button>
        </Modal>
      )}
      <table style={tableStyle}>
        <thead><tr>{["Invoice #","Client","Date","Due Date","Amount","Status",""].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {invoices.sort((a,b)=>b.date.localeCompare(a.date)).map(inv=>{
            const client = clients.find(c=>c.id===inv.clientId);
            return (
              <tr key={inv.id} style={{ borderBottom:"1px solid #1a2030" }}>
                <td style={tdStyle}><span style={{ fontFamily:"monospace",fontSize:12,color:"#f5a623" }}>{inv.id.toUpperCase()}</span></td>
                <td style={tdStyle}><strong style={{ color:"#e8dcc8" }}>{client?.company||"—"}</strong></td>
                <td style={tdStyle}><span style={{ fontFamily:"monospace",fontSize:12,color:"#888" }}>{inv.date}</span></td>
                <td style={tdStyle}><span style={{ fontFamily:"monospace",fontSize:12,color:"#888" }}>{inv.dueDate}</span></td>
                <td style={tdStyle}><span style={{ color:"#00e5a0",fontWeight:700,fontSize:15 }}>${inv.amount}</span></td>
                <td style={tdStyle}><Badge status={inv.status}/></td>
                <td style={tdStyle}>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>setForm(inv)} style={btnStyle("#1e2530","#e8dcc8",true)}>EDIT</button>
                    <button onClick={()=>setPrintInv(inv)} style={btnStyle("#1e2530","#00e5a0",true)}>PRINT</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PrintInvoice({ invoice, clients, incidents, onClose }) {
  const client = clients.find(c=>c.id===invoice.clientId);
  const incident = incidents.find(i=>i.id===invoice.incidentId);
  return (
    <div style={{ position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:"#fff",color:"#111",width:600,borderRadius:4,padding:48,fontFamily:"Georgia,serif",position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute",top:16,right:16,background:"none",border:"1px solid #ccc",borderRadius:2,cursor:"pointer",padding:"4px 10px",fontSize:12 }}>✕ Close</button>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:32 }}>
          <div>
            <div style={{ fontSize:28,fontWeight:900,letterSpacing:2,fontFamily:"'Bebas Neue',Georgia,serif",color:"#111" }}>FLEET ROAD 247</div>
            <div style={{ fontSize:11,color:"#888",letterSpacing:1 }}>24/7 FLEET ROADSIDE ASSISTANCE</div>
            <div style={{ fontSize:11,color:"#888",marginTop:4 }}>Michigan Operations</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:22,fontWeight:700,color:"#f5a623",letterSpacing:1 }}>INVOICE</div>
            <div style={{ fontFamily:"monospace",fontSize:13,color:"#555",marginTop:4 }}>{invoice.id.toUpperCase()}</div>
            <div style={{ fontSize:12,color:"#888",marginTop:4 }}>Date: {invoice.date}</div>
            <div style={{ fontSize:12,color:"#888" }}>Due: {invoice.dueDate}</div>
          </div>
        </div>
        <div style={{ borderTop:"2px solid #f5a623",paddingTop:20,marginBottom:24 }}>
          <div style={{ fontSize:11,letterSpacing:2,color:"#888",marginBottom:8 }}>BILL TO</div>
          <div style={{ fontSize:16,fontWeight:700 }}>{client?.company}</div>
          <div style={{ fontSize:13,color:"#555" }}>{client?.contact}</div>
          <div style={{ fontSize:13,color:"#555" }}>{client?.phone}</div>
        </div>
        {incident && (
          <div style={{ background:"#f9f9f9",padding:"12px 16px",borderRadius:4,marginBottom:24 }}>
            <div style={{ fontSize:11,letterSpacing:2,color:"#888",marginBottom:6 }}>SERVICE DETAILS</div>
            <div style={{ fontSize:13 }}>{incident.type} — {incident.location}</div>
            <div style={{ fontSize:12,color:"#888",marginTop:4 }}>{incident.notes}</div>
          </div>
        )}
        <table style={{ width:"100%",borderCollapse:"collapse",marginBottom:24 }}>
          <thead>
            <tr style={{ background:"#111",color:"#fff" }}>
              <th style={{ padding:"10px 14px",textAlign:"left",fontSize:11,letterSpacing:2 }}>DESCRIPTION</th>
              <th style={{ padding:"10px 14px",textAlign:"right",fontSize:11,letterSpacing:2 }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom:"1px solid #eee" }}>
              <td style={{ padding:"12px 14px",fontSize:13 }}>Roadside Assistance Service</td>
              <td style={{ padding:"12px 14px",textAlign:"right",fontSize:13,fontWeight:700 }}>${invoice.amount}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ background:"#f5f5f5" }}>
              <td style={{ padding:"12px 14px",fontSize:14,fontWeight:700 }}>TOTAL DUE</td>
              <td style={{ padding:"12px 14px",textAlign:"right",fontSize:20,fontWeight:900,color:"#f5a623" }}>${invoice.amount}</td>
            </tr>
          </tfoot>
        </table>
        <div style={{ borderTop:"1px solid #eee",paddingTop:16,fontSize:11,color:"#aaa",textAlign:"center" }}>
          Thank you for your business · Fleet Road 247 · Michigan · Available 24/7
        </div>
        <div style={{ textAlign:"center",marginTop:20 }}>
          <button onClick={()=>window.print()} style={{ background:"#111",color:"#fff",border:"none",padding:"10px 28px",borderRadius:2,cursor:"pointer",fontSize:13,letterSpacing:2 }}>PRINT / SAVE PDF</button>
        </div>
      </div>
    </div>
  );
}

// Shared UI components
const Modal = ({ title, children, onClose }) => (
  <div style={{ position:"fixed",inset:0,background:"#000c",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center" }}>
    <div style={{ background:"#0f1318",border:"1px solid #2a3040",borderRadius:4,padding:32,width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto",position:"relative" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <span style={{ fontSize:11,letterSpacing:3,color:"#f5a623" }}>{title.toUpperCase()}</span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:18 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange, type="text", textarea=false }) => (
  <div style={{ marginBottom:12 }}>
    <label style={labelStyle}>{label}</label>
    {textarea
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} style={{...inputStyle,height:72,resize:"vertical"}}/>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}/>
    }
  </div>
);

const Badge = ({ status }) => (
  <span style={{ fontSize:10,letterSpacing:1.5,padding:"3px 8px",borderRadius:2,background:statusColor(status)+"22",color:statusColor(status),border:`1px solid ${statusColor(status)}44` }}>
    {status.toUpperCase().replace("-"," ")}
  </span>
);

const btnStyle = (bg, color, small=false) => ({
  background: bg, color, border: `1px solid ${bg === "#0a0d12" ? "#f5a623" : bg}`,
  borderRadius: 2, cursor: "pointer", padding: small ? "4px 10px" : "8px 18px",
  fontSize: small ? 10 : 11, letterSpacing: 2, fontWeight: 700, fontFamily: "monospace",
});
const tableStyle = { width:"100%", borderCollapse:"collapse" };
const thStyle = { textAlign:"left", fontSize:10, letterSpacing:2, color:"#556", padding:"8px 12px", borderBottom:"1px solid #1e2530" };
const tdStyle = { padding:"12px", fontSize:13, color:"#ccc", verticalAlign:"middle" };
const inputStyle = { width:"100%", background:"#0a0d12", border:"1px solid #2a3040", borderRadius:2, padding:"8px 12px", color:"#e8dcc8", fontSize:13, fontFamily:"monospace", boxSizing:"border-box" };
const labelStyle = { display:"block", fontSize:10, letterSpacing:2, color:"#556", marginBottom:6 };

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [clients, setClients] = useStorage(STORAGE_KEYS.clients, initialClients);
  const [incidents, setIncidents] = useStorage(STORAGE_KEYS.incidents, initialIncidents);
  const [contractors, setContractors] = useStorage(STORAGE_KEYS.contractors, initialContractors);
  const [invoices, setInvoices] = useStorage(STORAGE_KEYS.invoices, initialInvoices);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#080b10", color:"#c8c0b0", fontFamily:"'Syne',sans-serif" }}>
      {/* Header */}
      <div style={{ background:"#0a0d12", borderBottom:"1px solid #1e2530", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:22, fontWeight:900, letterSpacing:3, color:"#f5a623", fontFamily:"'Bebas Neue',sans-serif" }}>FLEET ROAD 247</span>
          <span style={{ fontSize:10, color:"#556", letterSpacing:2, borderLeft:"1px solid #1e2530", paddingLeft:16 }}>DISPATCH · CRM · OPERATIONS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#00e5a0", display:"inline-block", boxShadow:"0 0 6px #00e5a0" }}></span>
          <span style={{ fontSize:11, color:"#00e5a0", letterSpacing:2 }}>SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:"#0a0d12", borderBottom:"1px solid #1a2030", padding:"0 32px", display:"flex", gap:0 }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            background:"none", border:"none", borderBottom: tab===t ? "2px solid #f5a623" : "2px solid transparent",
            color: tab===t ? "#f5a623" : "#556", cursor:"pointer", padding:"14px 20px",
            fontSize:11, letterSpacing:2, fontFamily:"'Syne',sans-serif", fontWeight:700,
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:"32px", maxWidth:1200, margin:"0 auto" }}>
        {tab === "Dashboard" && (
          <div>
            <WeeklySummary clients={clients} incidents={incidents} invoices={invoices}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"#0f1318", border:"1px solid #1e2530", borderRadius:4, padding:20 }}>
                <div style={{ fontSize:11, letterSpacing:3, color:"#f5a623", marginBottom:16 }}>RECENT INCIDENTS</div>
                {incidents.slice(-3).reverse().map(inc=>{
                  const c = clients.find(x=>x.id===inc.clientId);
                  return (
                    <div key={inc.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #1a2030" }}>
                      <div>
                        <div style={{ fontSize:13, color:"#e8dcc8" }}>{c?.company}</div>
                        <div style={{ fontSize:11, color:"#888" }}>{inc.type} · {inc.date}</div>
                      </div>
                      <Badge status={inc.status}/>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:"#0f1318", border:"1px solid #1e2530", borderRadius:4, padding:20 }}>
                <div style={{ fontSize:11, letterSpacing:3, color:"#f5a623", marginBottom:16 }}>INVOICE OVERVIEW</div>
                {invoices.slice(-3).reverse().map(inv=>{
                  const c = clients.find(x=>x.id===inv.clientId);
                  return (
                    <div key={inv.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #1a2030" }}>
                      <div>
                        <div style={{ fontSize:13, color:"#e8dcc8" }}>{c?.company}</div>
                        <div style={{ fontSize:11, fontFamily:"monospace", color:"#888" }}>{inv.id.toUpperCase()} · {inv.date}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:"#00e5a0", fontWeight:700 }}>${inv.amount}</div>
                        <Badge status={inv.status}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {tab === "Clients" && <ClientsTab clients={clients} setClients={setClients} incidents={incidents}/>}
        {tab === "Incidents" && <IncidentsTab incidents={incidents} setIncidents={setIncidents} clients={clients} contractors={contractors}/>}
        {tab === "Contractors" && <ContractorsTab contractors={contractors} setContractors={setContractors}/>}
        {tab === "Invoices" && <InvoicesTab invoices={invoices} setInvoices={setInvoices} clients={clients} incidents={incidents}/>}
      </div>
    </div>
  );
}
