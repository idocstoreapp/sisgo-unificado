"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Users, ShieldCheck, Package, Building, Save, Plus, Trash2, Edit2, Check, X, ChevronDown } from "lucide-react";

type Tab = "usuarios" | "garantias" | "catalogo" | "proveedores";

interface UserRow { id: string; name: string; email: string; role: string; commission_percentage: number | null; sueldo_base: number | null; sueldo_frecuencia: string | null; }
interface CompanyConfig { id: string; warranty_days: number; commission_percentage: number; config?: any; }
interface Service { id: string; name: string; category: string; default_price: number; is_active: boolean; }
interface Supplier { id: string; name: string; phone: string | null; email: string | null; notes: string | null; }

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ id, active, icon, label, onClick }: { id: Tab; active: Tab; icon: React.ReactNode; label: string; onClick: (t: Tab) => void; }) {
  const isActive = id === active;
  return (
    <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${isActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
      {icon}{label}
    </button>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ companyId }: { companyId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<UserRow>>>({});

  useEffect(() => {
    supabase.from("users").select("id,name,email,role,commission_percentage,sueldo_base,sueldo_frecuencia").eq("company_id", companyId).order("name")
      .then(({ data }) => { if (data) setUsers(data as UserRow[]); setLoading(false); });
  }, [companyId]);

  const setEdit = (id: string, field: string, value: any) => setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const saveUser = async (user: UserRow) => {
    setSaving(user.id);
    const patch = edits[user.id] || {};
    await supabase.from("users").update({ commission_percentage: patch.commission_percentage ?? user.commission_percentage, sueldo_base: patch.sueldo_base ?? user.sueldo_base, sueldo_frecuencia: patch.sueldo_frecuencia ?? user.sueldo_frecuencia, updated_at: new Date().toISOString() }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...patch } : u));
    setEdits(prev => { const n = { ...prev }; delete n[user.id]; return n; });
    setSaving(null);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Configura las comisiones y sueldos de cada usuario de tu empresa.</p>
      {users.map(user => {
        const e = edits[user.id] || {};
        const commPct = e.commission_percentage ?? user.commission_percentage ?? 0;
        const sueldoBase = e.sueldo_base ?? user.sueldo_base ?? 0;
        const frecuencia = e.sueldo_frecuencia ?? user.sueldo_frecuencia ?? "mensual";
        const isDirty = !!edits[user.id];
        return (
          <div key={user.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900">{user.name}</h4>
                <p className="text-xs text-slate-400">{user.email} · <span className="capitalize">{user.role}</span></p>
              </div>
              {isDirty && (
                <button onClick={() => saveUser(user)} disabled={saving === user.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                  {saving === user.id ? <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full" /> : <Check className="w-3.5 h-3.5" />}
                  Guardar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Comisión (%)</label>
                <input type="number" min="0" max="100" value={commPct} onChange={e => setEdit(user.id, "commission_percentage", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sueldo Base ($)</label>
                <input type="number" min="0" value={sueldoBase} onChange={e => setEdit(user.id, "sueldo_base", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Frecuencia de Pago</label>
                <select value={frecuencia} onChange={e => setEdit(user.id, "sueldo_frecuencia", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 outline-none">
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Warranty Tab ─────────────────────────────────────────────────────────────
function WarrantyTab({ company, onSaved }: { company: CompanyConfig; onSaved: () => void }) {
  const [days, setDays] = useState(company.warranty_days ?? 30);
  const [commPct, setCommPct] = useState(company.commission_percentage ?? 40);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const presets = [15, 30, 60, 90];

  const save = async () => {
    setSaving(true);
    await supabase.from("companies").update({
      commission_percentage: commPct,
      config: { ...(company.config || {}), warranty_days: days },
      updated_at: new Date().toISOString()
    }).eq("id", company.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500" />Días de Garantía</h3>
        <p className="text-sm text-slate-500">Las órdenes completadas tendrán garantía por este tiempo.</p>
        <div className="flex gap-2 flex-wrap">
          {presets.map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${days === d ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-200"}`}>{d} días</button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Personalizado (días)</label>
          <input type="number" min="1" value={days} onChange={e => setDays(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" />Comisión por Defecto</h3>
        <p className="text-sm text-slate-500">Porcentaje de comisión aplicado cuando el técnico no tiene uno personalizado.</p>
        <input type="number" min="0" max="100" value={commPct} onChange={e => setCommPct(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
        {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "¡Guardado!" : "Guardar Cambios"}
      </button>
    </div>
  );
}

// ─── Catalog Tab ──────────────────────────────────────────────────────────────
function CatalogTab({ companyId }: { companyId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState(""); const [newPrice, setNewPrice] = useState(""); const [newCat, setNewCat] = useState(""); const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("catalog_services").select("id,name,category,default_price,is_active").eq("company_id", companyId).order("name");
    if (data) setServices(data as Service[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const addService = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await supabase.from("catalog_services").insert({ company_id: companyId, name: newName.trim(), category: newCat.trim() || "General", default_price: Number(newPrice) || 0, is_active: true });
    setNewName(""); setNewPrice(""); setNewCat(""); setAdding(false); load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("catalog_services").update({ is_active: !current }).eq("id", id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[150px]"><label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del servicio</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 outline-none" placeholder="Ej: Cambio de pantalla" /></div>
        <div className="w-32"><label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
          <input value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 outline-none" placeholder="Ej: Pantallas" /></div>
        <div className="w-32"><label className="block text-xs font-semibold text-slate-600 mb-1">Precio ($)</label>
          <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 outline-none" /></div>
        <button onClick={addService} disabled={adding || !newName.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
          <Plus className="w-4 h-4" />Agregar</button>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {services.map(s => (
          <div key={s.id} className={`bg-white rounded-2xl border-2 p-4 shadow-sm flex items-center justify-between transition-all ${s.is_active ? "border-slate-100" : "border-slate-100 opacity-50"}`}>
            <div>
              <p className="font-semibold text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-400">{s.category} · ${Number(s.default_price).toLocaleString("es-CL")}</p>
            </div>
            <button onClick={() => toggleActive(s.id, s.is_active)} className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${s.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700" : "bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"}`}>
              {s.is_active ? "Activo" : "Inactivo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Suppliers Tab ────────────────────────────────────────────────────────────
function SuppliersTab({ companyId }: { companyId: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("suppliers").select("id,name,phone,email,notes").eq("company_id", companyId).order("name");
    if (data) setSuppliers(data as Supplier[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    await supabase.from("suppliers").insert({ company_id: companyId, name: form.name.trim(), phone: form.phone || null, email: form.email || null, notes: form.notes || null });
    setForm({ name: "", phone: "", email: "", notes: "" }); setAdding(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    setDeleting(id);
    await supabase.from("suppliers").delete().eq("id", id);
    setDeleting(null); load();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[["Nombre *", "name", "Ej: TechParts Ltda."], ["Teléfono", "phone", "+56 9 xxxx xxxx"], ["Email", "email", "contacto@proveedor.com"], ["Notas", "notes", "Productos principales, condiciones..."]]
          .map(([label, field, ph]) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 outline-none" placeholder={ph} />
            </div>
          ))}
        <div className="sm:col-span-2 flex justify-end">
          <button onClick={add} disabled={adding || !form.name.trim()} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Plus className="w-4 h-4" />Agregar Proveedor
          </button>
        </div>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-900">{s.name}</p>
              {s.phone && <p className="text-xs text-slate-500">📞 {s.phone}</p>}
              {s.email && <p className="text-xs text-slate-500">✉️ {s.email}</p>}
              {s.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{s.notes}</p>}
            </div>
            <button onClick={() => remove(s.id)} disabled={deleting === s.id} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
              {deleting === s.id ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ))}
        {suppliers.length === 0 && <div className="sm:col-span-2 text-center py-8 text-slate-400"><Building className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Sin proveedores aún</p></div>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("usuarios");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("company_id").eq("id", user.id).single();
      if (data?.company_id) {
        setCompanyId(data.company_id);
        const { data: co } = await supabase.from("companies").select("id,commission_percentage,config").eq("id", data.company_id).single();
        if (co) {
          const coParsed = co as any;
          setCompany({
            id: coParsed.id,
            commission_percentage: coParsed.commission_percentage ?? 40,
            warranty_days: coParsed.config?.warranty_days ?? 30,
            config: coParsed.config,
          });
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  if (!companyId || !company) return <div className="p-8 text-center text-red-500">No se pudo cargar la configuración.</div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-bold">Configuración</h1>
            <p className="text-slate-400 text-sm">Personaliza tu empresa, usuarios y servicios</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabBtn id="usuarios" active={tab} icon={<Users className="w-4 h-4" />} label="Usuarios y Comisiones" onClick={setTab} />
        <TabBtn id="garantias" active={tab} icon={<ShieldCheck className="w-4 h-4" />} label="Garantías" onClick={setTab} />
        <TabBtn id="catalogo" active={tab} icon={<Package className="w-4 h-4" />} label="Catálogo de Servicios" onClick={setTab} />
        <TabBtn id="proveedores" active={tab} icon={<Building className="w-4 h-4" />} label="Proveedores" onClick={setTab} />
      </div>

      {/* Content */}
      <div>
        {tab === "usuarios" && <UsersTab companyId={companyId} />}
        {tab === "garantias" && <WarrantyTab company={company} onSaved={() => {}} />}
        {tab === "catalogo" && <CatalogTab companyId={companyId} />}
        {tab === "proveedores" && <SuppliersTab companyId={companyId} />}
      </div>
    </div>
  );
}
