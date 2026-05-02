import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  PackageCheck,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";

const navItems = [
  { label: "Funciones", menu: true },
  { label: "Precios" },
  { label: "Recursos", menu: true },
  { label: "Casos de éxito" },
  { label: "Empresa", menu: true },
];

const dashboardItems = [
  { label: "Inicio", icon: LayoutDashboard, active: true },
  { label: "Órdenes", icon: ClipboardList },
  { label: "Clientes", icon: Users },
  { label: "Técnicos", icon: Wrench },
  { label: "Inventario", icon: Boxes },
  { label: "Pagos", icon: CircleDollarSign },
  { label: "Reportes", icon: BriefcaseBusiness },
  { label: "Configuración", icon: Settings },
];

const orderCards = [
  ["Cliente", "Mariana Soto", "Notebook con falla de carga"],
  ["Técnico", "Asignado", "Revisión y presupuesto"],
  ["Inventario", "2 repuestos", "Reservados para reparación"],
  ["Cobro", "$128.000", "Pendiente de confirmación"],
];

const orderSteps = [
  ["Recepción", "Datos del cliente, equipo, accesorios y diagnóstico inicial.", "Completado"],
  ["Trabajo técnico", "Seguimiento por responsable, estados y notas internas.", "En proceso"],
  ["Entrega y pago", "Registro de cobro, comprobante y cierre de la orden.", "Pendiente"],
];

const features = [
  {
    title: "Órdenes inteligentes",
    description: "Crea y sigue cada orden de principio a fin.",
    icon: ClipboardList,
    tone: "from-indigo-500/20 to-violet-500/10 text-indigo-700",
  },
  {
    title: "Clientes y equipos",
    description: "Historial completo de clientes y dispositivos.",
    icon: Users,
    tone: "from-violet-500/20 to-fuchsia-500/10 text-violet-700",
  },
  {
    title: "Técnicos y permisos",
    description: "Asigna roles y controla accesos fácilmente.",
    icon: ShieldCheck,
    tone: "from-blue-500/20 to-cyan-500/10 text-blue-700",
  },
  {
    title: "Inventario y repuestos",
    description: "Stock, reservas y alertas en tiempo real.",
    icon: PackageCheck,
    tone: "from-emerald-500/20 to-green-500/10 text-emerald-700",
  },
  {
    title: "Pagos y reportes",
    description: "Cobros, gastos y reportes claros y exportables.",
    icon: CircleDollarSign,
    tone: "from-orange-500/20 to-amber-500/10 text-orange-700",
  },
];

const logos = ["MOTORFIX", "RUTA MOTOR", "PROTALLER", "MECA+", "SERVITEC", "PITSTOP"];

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9ff] text-[#070b24]">
      <section className="relative border-b border-[#dfe4ff] bg-[radial-gradient(circle_at_37%_26%,rgba(112,84,255,0.22),transparent_22%),radial-gradient(circle_at_86%_8%,rgba(72,105,255,0.18),transparent_24%),linear-gradient(180deg,#fbfcff_0%,#f7f8ff_68%,#ffffff_100%)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/95 to-transparent" />
        <div className="relative mx-auto max-w-[1840px] px-6 pt-5 pb-10 sm:px-8 lg:px-14">
          <header className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label="SISGO inicio">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#1230ff] to-[#9157ff] text-sm font-black text-white shadow-[0_10px_24px_rgba(81,65,255,0.35)]">
                S
              </span>
              <span className="text-lg font-black tracking-normal text-[#070b24]">SISGO</span>
            </Link>

            <nav className="hidden items-center gap-12 text-sm font-semibold text-[#0e1531] lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href="/register"
                  className="inline-flex items-center gap-1.5"
                >
                  {item.label}
                  {item.menu ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-[#0e1531] sm:inline-flex"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#050923] px-5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(51,43,155,0.28)] transition hover:bg-[#12193c] focus-visible:ring-2 focus-visible:ring-[#7967ff] focus-visible:outline-none"
              >
                Comenzar prueba gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <div className="grid items-start gap-8 pt-6 xl:grid-cols-[0.78fr_1.22fr] 2xl:gap-12 2xl:pt-8">
            <div className="relative z-10 max-w-[760px]">
              <span className="mb-4 inline-flex rounded-full bg-[#eef0ff] px-4 py-2 text-xs font-black tracking-[0.24em] text-[#7b72d5] uppercase">
                Software para talleres
              </span>
              <h1 className="text-[clamp(2.75rem,3.35vw,3.875rem)] leading-[1.04] font-black tracking-normal text-[#070b24]">
                Ordena tu taller desde la primera{" "}
                <span className="bg-gradient-to-r from-[#8f52ff] to-[#164eff] bg-clip-text text-transparent">
                  recepción hasta el cobro.
                </span>
              </h1>
              <p className="mt-4 max-w-[640px] text-lg leading-8 font-medium text-[#4d5a7d]">
                SISGO organiza órdenes, clientes, técnicos, inventario, pagos y reportes en un flujo
                simple, automático e inteligente.
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-[#050923] px-7 text-base font-bold text-white shadow-[0_18px_38px_rgba(92,61,255,0.34)] transition hover:bg-[#111842] focus-visible:ring-2 focus-visible:ring-[#7b65ff] focus-visible:outline-none 2xl:min-h-16"
                >
                  Comenzar prueba gratuita
                  <Sparkles className="h-4 w-4 text-[#b993ff]" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-lg border border-[#e2e5f4] bg-white/86 px-7 text-base font-bold text-[#111730] shadow-[0_16px_34px_rgba(45,55,110,0.08)] transition hover:border-[#cfd6ff] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#7b65ff] focus-visible:outline-none 2xl:min-h-16"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0edff] text-[#704cff]">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                  Ver cómo funciona
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium text-[#4d5a7d]">
                {["7 días gratis", "Sin tarjeta de crédito", "Cancela cuando quieras"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <Check className="h-5 w-5 rounded-full bg-[#ded9ff] p-1 text-[#6547ff]" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="relative min-h-[540px] md:min-h-[610px] xl:min-h-[560px] 2xl:min-h-[690px]">
              <div className="absolute top-10 left-[-210px] hidden h-[520px] w-[520px] rounded-full border border-white/70 bg-[radial-gradient(circle,#ffffff_0%,rgba(116,92,255,0.17)_25%,transparent_58%)] shadow-[inset_0_0_80px_rgba(255,255,255,0.8)] xl:block">
                <div className="absolute top-1/2 left-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#6a55ff] to-[#9d6eff] text-4xl font-black text-white shadow-[0_0_52px_rgba(99,75,255,0.55)]">
                  IA
                </div>
                <span className="absolute top-[48%] left-[58%] h-px w-48 bg-gradient-to-r from-[#775cff] to-transparent" />
                <span className="absolute top-[54%] left-[58%] h-px w-52 rotate-6 bg-gradient-to-r from-[#234fff] to-transparent" />
              </div>

              <div className="absolute bottom-3 left-0 z-20 hidden w-[210px] rounded-lg border border-[#e1e5f4] bg-white/90 p-4 shadow-[0_22px_55px_rgba(49,58,122,0.16)] backdrop-blur xl:block">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eef0ff] text-[#204cff]">
                    <BrainCircuit className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-black">SISGO IA</p>
                </div>
                <p className="mb-4 text-xs font-semibold text-[#667092]">
                  Analizando datos del taller...
                </p>
                {[
                  "Órdenes optimizadas",
                  "Inventario al día",
                  "Cobros en seguimiento",
                  "Rendimiento del equipo",
                ].map((item) => (
                  <p
                    key={item}
                    className="mt-3 flex items-center gap-2 text-xs font-medium text-[#25304e]"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </p>
                ))}
              </div>

              <div className="relative z-10 mx-auto grid w-full max-w-[980px] grid-cols-1 overflow-hidden rounded-[22px] border border-[#dde3f7] bg-white/86 shadow-[0_34px_80px_rgba(62,72,140,0.22)] backdrop-blur-xl md:grid-cols-[150px_minmax(0,1fr)] 2xl:ml-auto 2xl:grid-cols-[168px_minmax(0,1fr)_220px]">
                <aside className="border-r border-[#e4e8f7] bg-[#f8f9ff]/80 px-4 py-4 max-md:hidden">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#071159] text-sm font-black text-white">
                      S
                    </span>
                    <span className="text-sm font-black">SISGO</span>
                  </div>
                  <div className="space-y-2">
                    {dashboardItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={`flex h-8 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${
                            item.active ? "bg-[#eceeff] text-[#1948ff]" : "text-[#667092]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </aside>

                <div className="px-5 py-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#667092]">Panel operativo</p>
                      <h2 className="mt-1 text-2xl leading-tight font-black">Orden #ST-1048</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                        En taller
                      </span>
                      <span className="rounded-lg bg-[#f1f2ff] px-4 py-2 text-xs font-black text-[#111a44]">
                        En proceso
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {orderCards.map(([label, value, detail], index) => (
                      <div
                        key={label}
                        className="min-h-[76px] rounded-lg border border-[#e4e8f7] bg-white p-3 shadow-[0_14px_34px_rgba(44,54,112,0.06)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-[#7a84a4]">{label}</p>
                            <p className="mt-1 text-base font-black text-[#111730]">{value}</p>
                            <p className="mt-1 text-xs leading-5 font-medium text-[#667092]">
                              {detail}
                            </p>
                          </div>
                          {index > 1 ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0edff] text-[#644cff]">
                              {index === 2 ? (
                                <PackageCheck className="h-4 w-4" />
                              ) : (
                                <CircleDollarSign className="h-4 w-4" />
                              )}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <p className="mb-3 text-sm font-bold text-[#384365]">Flujo de la orden</p>
                    <div className="space-y-3">
                      {orderSteps.map(([title, description, status], index) => (
                        <div
                          key={title}
                          className="grid grid-cols-[32px_minmax(0,1fr)_86px] items-center gap-3 rounded-lg border border-[#e4e8f7] bg-white px-4 py-2"
                        >
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                              index === 1
                                ? "bg-[#dcd7ff] text-[#523dff]"
                                : "bg-[#eef0ff] text-[#6170a8]"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-black">{title}</p>
                            <p className="mt-1 text-xs leading-5 font-medium text-[#667092]">
                              {description}
                            </p>
                          </div>
                          <p className="text-right text-xs font-semibold text-[#667092]">
                            {status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-3 border-t border-[#e4e8f7] pt-3 max-sm:grid-cols-2">
                    {[
                      ["36", "Órdenes activas"],
                      ["8", "En espera"],
                      ["$2.540.000", "Por cobrar"],
                      ["98%", "Cumplimiento"],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <p className="text-lg leading-tight font-black">{value}</p>
                        <p className="text-xs font-semibold text-[#667092]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="hidden space-y-3 border-l border-[#e4e8f7] bg-[#fbfcff]/80 p-3 2xl:block">
                  <div className="flex justify-end gap-4 text-[#54607f]">
                    <Bell className="h-5 w-5" />
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1f2b57] to-[#d8a87b]" />
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-[#101744] to-[#27206b] p-4 text-white shadow-[0_20px_44px_rgba(31,29,90,0.26)]">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-black">Actividad en tiempo real</p>
                      <ArrowRight className="h-4 w-4 text-[#9aa9ff]" />
                    </div>
                    {["Nueva orden recibida", "Repuesto reservado", "Pago registrado"].map(
                      (item) => (
                        <div key={item} className="mt-3 flex gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold">{item}</p>
                            <p className="mt-1 text-[11px] text-white/55">Hace 5 min</p>
                          </div>
                        </div>
                      ),
                    )}
                    <Link
                      href="/register"
                      className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-white/10 text-xs font-bold"
                    >
                      Ver todas las actividades
                    </Link>
                  </div>

                  <div className="rounded-lg border border-[#dfe4ff] bg-white p-4">
                    <p className="text-sm font-black text-[#2648ff]">Predicción IA</p>
                    <p className="mt-3 text-xs font-semibold text-[#667092]">
                      Probabilidad de entrega a tiempo
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(#3e4fff_0_92%,#edf0ff_92%_100%)]">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-black">
                          92%
                        </div>
                      </div>
                      <p className="text-xs font-black text-emerald-600">¡Todo va muy bien!</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e8f7] bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-20 gap-y-5 px-6 py-8 text-lg font-black text-[#6d7593] italic sm:px-8">
          {logos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-12 sm:px-8 lg:py-8">
        <div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-[#5b43ff] uppercase">
              Todo lo que tu taller necesita
            </p>
            <h2 className="mt-4 text-4xl leading-tight font-black text-[#070b24]">
              Un sistema completo,{" "}
              <span className="bg-gradient-to-r from-[#784cff] to-[#184dff] bg-clip-text text-transparent">
                inteligente
              </span>{" "}
              y fácil de usar.
            </h2>
            <p className="mt-5 text-base leading-8 font-medium text-[#5e6887]">
              Automatizamos tareas, conectamos áreas y te entregamos información clara para que
              tomes mejores decisiones, más rápido.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="relative min-h-[190px] rounded-lg border border-[#e5e8f7] bg-white p-5 shadow-[0_18px_45px_rgba(40,51,110,0.07)]"
                >
                  <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-[#8a9dff]" />
                  <div
                    className={`mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.tone}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black text-[#070b24]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 font-medium text-[#5e6887]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1500px] gap-6 rounded-lg bg-[linear-gradient(110deg,#09133e_0%,#141b5b_48%,#5922b6_100%)] p-7 text-white shadow-[0_24px_60px_rgba(63,43,170,0.26)] lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] lg:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#f0f3ff]/10 shadow-[inset_0_0_28px_rgba(147,165,255,0.28)]">
              <BrainCircuit className="h-10 w-10 text-[#9fc3ff]" />
            </div>
            <div>
              <h2 className="text-xl font-black">SISGO IA trabaja por ti 24/7</h2>
              <p className="mt-2 max-w-md text-sm leading-7 font-medium text-white/76">
                Detecta riesgos, sugiere acciones y te ayuda a tomar mejores decisiones cada día.
              </p>
            </div>
          </div>
          {[
            ["+35%", "Órdenes completadas"],
            ["-40%", "Tiempo administrativo"],
            ["98%", "Clientes satisfechos"],
            ["24/7", "IA trabajando para ti"],
          ].map(([value, label]) => (
            <div key={label} className="border-white/12 lg:border-l lg:pl-8">
              <p className="text-3xl font-black text-[#bf9cff]">{value}</p>
              <p className="mt-2 text-sm font-medium text-white/78">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
