import Link from "next/link";
import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-20 space-y-8">
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Piloto SISGO Servicio Técnico
        </span>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Controla órdenes, técnicos y cobros desde el primer día.
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Diseñado para talleres pequeños, medianos y multi-sucursal. Activa tu prueba,
          crea tu primera orden y valida operación real con tu equipo en menos de una semana.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="rounded-lg bg-primary px-5 py-3 text-primary-foreground font-medium">
            Comenzar prueba
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-5 py-3 font-medium">
            Ya tengo cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}
