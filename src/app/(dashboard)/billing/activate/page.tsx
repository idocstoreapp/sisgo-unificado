import Link from "next/link";
import { CreditCard, MessageCircle, ShieldCheck } from "lucide-react";

export default function ActivateBillingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
      <div className="border-border bg-card rounded-xl border p-6 shadow-sm md:p-8">
        <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
          <CreditCard className="size-6" />
        </div>

        <h1 className="text-card-foreground text-2xl font-semibold">
          Activa SISGO para seguir operando
        </h1>
        <p className="text-muted-foreground mt-3">
          Tu prueba terminó. Las órdenes y datos quedan guardados; para continuar creando y
          gestionando operación, activa un plan con soporte de puesta en marcha.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="border-border rounded-lg border p-4">
            <ShieldCheck className="text-primary mb-3 size-5" />
            <h2 className="font-medium">Bloqueo suave</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Mantiene lectura y evita pérdida de información mientras regularizas el pago.
            </p>
          </div>
          <div className="border-border rounded-lg border p-4">
            <MessageCircle className="text-primary mb-3 size-5" />
            <h2 className="font-medium">Activación asistida</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Ideal para ajustar usuarios, sucursales y pagos antes de salir a terreno.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="mailto:ventas@sisgo.cl?subject=Activar%20SISGO"
            className="bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-semibold"
          >
            Solicitar activación
          </a>
          <Link
            href="/dashboard"
            className="border-border rounded-lg border px-5 py-3 text-sm font-semibold"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
