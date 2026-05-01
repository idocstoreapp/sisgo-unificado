import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <section className="border-border from-muted/60 to-background border-b bg-gradient-to-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3" aria-label="SISGO inicio">
                <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold">
                  S
                </span>
                <span className="text-lg font-semibold">SISGO</span>
              </Link>
              <Link
                href="/login"
                className="border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring rounded-lg border px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none"
              >
                Iniciar sesión
              </Link>
            </div>

            <span className="border-border bg-background text-muted-foreground mb-5 inline-flex w-fit rounded-full border px-3 py-1 text-sm font-medium">
              Prueba para talleres de servicio técnico
            </span>
            <h1 className="text-foreground max-w-3xl text-4xl leading-tight font-bold tracking-normal md:text-5xl lg:text-6xl">
              Ordena tu taller desde la primera recepción hasta el cobro.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
              SISGO concentra órdenes, clientes, técnicos, inventario, pagos y reportes en un flujo
              simple para talleres pequeños, medianos y con varias sucursales.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Comenzar prueba
              </Link>
              <Link
                href="/login"
                className="border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring inline-flex min-h-12 items-center justify-center rounded-lg border px-6 py-3 text-base font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Entrar a mi cuenta
              </Link>
            </div>

            <dl className="border-border mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t pt-6">
              <div>
                <dt className="text-muted-foreground text-sm">Inicio</dt>
                <dd className="mt-1 text-2xl font-bold">1 día</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Flujo</dt>
                <dd className="mt-1 text-2xl font-bold">360</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Equipo</dt>
                <dd className="mt-1 text-2xl font-bold">Multirol</dd>
              </div>
            </dl>
          </div>

          <div
            className="border-border bg-card rounded-lg border p-4 shadow-sm lg:p-5"
            aria-label="Vista del flujo SISGO"
          >
            <div className="border-border mb-4 flex items-center justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Panel operativo</p>
                <h2 className="text-xl font-semibold">Orden #ST-1048</h2>
              </div>
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
                En taller
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Cliente", "Mariana Soto", "Notebook con falla de carga"],
                ["Técnico", "Asignado", "Revisión y presupuesto"],
                ["Inventario", "2 repuestos", "Reservados para reparación"],
                ["Cobro", "$128.000", "Pendiente de confirmación"],
              ].map(([label, value, detail]) => (
                <div key={label} className="border-border bg-background rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">{detail}</p>
                </div>
              ))}
            </div>

            <ol className="mt-5 space-y-3" aria-label="Etapas de una orden de trabajo">
              {[
                ["Recepción", "Datos del cliente, equipo, accesorios y diagnóstico inicial."],
                ["Trabajo técnico", "Seguimiento por responsable, estados y notas internas."],
                ["Entrega y pago", "Registro de cobro, comprobante y cierre de la orden."],
              ].map(([title, description], index) => (
                <li key={title} className="bg-muted/60 flex gap-3 rounded-lg p-4">
                  <span className="bg-background flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "Taller pequeño",
              "Deja atrás planillas y mensajes sueltos. Crea órdenes, consulta estados y cobra sin duplicar información.",
            ],
            [
              "Taller mediano",
              "Coordina recepción, técnicos y administración con permisos, listas de trabajo y reportes diarios.",
            ],
            [
              "Taller grande",
              "Gestiona sucursales, responsables, finanzas e inventario con una operación trazable por equipo.",
            ],
          ].map(([title, description]) => (
            <article key={title} className="border-border bg-card rounded-lg border p-5">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-muted-foreground mt-3 leading-7">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-border bg-muted/50 border-y">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Qué valida la prueba
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-bold">
              Una semana para probar el flujo completo con órdenes reales.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Crear órdenes con cliente, equipo, servicios y checklist.",
              "Asignar técnicos y ver carga de trabajo por estado.",
              "Controlar pagos, gastos y reportes de caja.",
              "Separar sucursales, roles y permisos cuando el taller crece.",
            ].map((item) => (
              <div key={item} className="border-border bg-background rounded-lg border p-4">
                <p className="leading-7">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="border-border bg-primary text-primary-foreground flex flex-col items-start justify-between gap-6 rounded-lg border p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Activa SISGO y prueba tu operación sin esperar una demo.
            </h2>
            <p className="text-primary-foreground/80 mt-2 max-w-3xl">
              Registra tu empresa, invita a tu equipo y mide si el sistema calza con tu taller desde
              el primer día.
            </p>
          </div>
          <Link
            href="/register"
            className="bg-background text-foreground hover:bg-background/90 focus-visible:ring-background inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg px-6 py-3 font-semibold transition focus-visible:ring-2 focus-visible:outline-none"
          >
            Comenzar prueba
          </Link>
        </div>
      </section>
    </main>
  );
}
