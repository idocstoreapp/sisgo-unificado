import { Activity, LockKeyhole, Sparkles, Target, Zap } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  footer: ReactNode;
};

const insights = [
  {
    title: "Analizando órdenes activas",
    description: "Monitoreamos el estado de cada trabajo en tiempo real.",
    icon: Activity,
    tone: "bg-[#edefff] text-[#4f58ff]",
  },
  {
    title: "Detectando oportunidades",
    description: "Encontramos cuellos de botella y posibles retrasos para que tomes acción.",
    icon: Target,
    tone: "bg-[#e7fbf5] text-[#20b889]",
  },
  {
    title: "Sugiriendo acciones inteligentes",
    description: "Te recomendamos los mejores pasos para optimizar tiempos y aumentar ganancias.",
    icon: Zap,
    tone: "bg-[#f0edff] text-[#704cff]",
  },
];

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-[#fbfcff] text-[#080d2a] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_72%_45%,rgba(92,85,255,0.24),transparent_18%),radial-gradient(circle_at_88%_12%,rgba(118,91,255,0.16),transparent_25%),linear-gradient(145deg,#fbfcff_0%,#f4f6ff_54%,#eceeff_100%)] px-6 py-8 sm:px-10 lg:px-16">
        <div className="absolute inset-y-0 right-[-160px] hidden w-[620px] rounded-full border border-white/60 bg-[radial-gradient(circle,#ffffff_0%,rgba(93,82,255,0.2)_24%,transparent_60%)] shadow-[inset_0_0_90px_rgba(255,255,255,0.76)] lg:block" />
        <div className="absolute top-[19%] right-[-40px] hidden h-[640px] w-[640px] rounded-full border border-[#bfc6ff]/40 lg:block" />
        <div className="absolute top-[25%] right-[2%] hidden h-[520px] w-[520px] rounded-full border border-[#cfd4ff]/55 lg:block" />
        <span className="absolute top-[26%] right-[18%] hidden h-3 w-3 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)] lg:block" />
        <span className="absolute top-[32%] right-[8%] hidden h-3 w-3 rounded-full bg-[#6d63ff] shadow-[0_0_18px_rgba(109,99,255,0.55)] lg:block" />
        <span className="absolute top-[55%] right-[12%] hidden h-3 w-3 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)] lg:block" />

        <div className="relative z-10 flex h-full min-h-[640px] max-w-[820px] flex-col">
          <header className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label="SISGO inicio">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-lg font-black text-white shadow-[0_14px_34px_rgba(29,35,78,0.22)]">
                S
              </span>
              <span className="text-2xl font-black tracking-normal">SISGO</span>
            </Link>
            <span className="h-8 w-px bg-[#cfd5ea]" />
            <span className="text-base font-semibold text-[#6d7899]">
              Sistema de Gestión Unificado
            </span>
          </header>

          <div className="my-auto py-14">
            <div className="mb-9 inline-flex items-center gap-4 rounded-full bg-white/64 px-5 py-3 shadow-[0_14px_34px_rgba(60,67,128,0.08)] ring-1 ring-[#e1e6fb] backdrop-blur">
              <span className="inline-flex items-center gap-2 text-sm font-black text-[#4c54ff]">
                <Sparkles className="h-4 w-4" />
                IA ACTIVA
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#5f6a8c]">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                Sistema operativo
              </span>
            </div>

            <h1 className="max-w-[650px] text-[44px] leading-[1.1] font-black tracking-normal text-[#080d2a] sm:text-6xl">
              SISGO IA está{" "}
              <span className="bg-gradient-to-r from-[#4f58ff] to-[#7d4cff] bg-clip-text text-transparent">
                optimizando talleres
              </span>{" "}
              ahora mismo
            </h1>
            <p className="mt-8 max-w-[560px] text-lg leading-9 font-medium text-[#5c6889]">
              Nuestra inteligencia artificial trabaja en segundo plano para que tu taller funcione
              mejor cada día.
            </p>

            <div className="relative mt-12 grid gap-7">
              <div className="absolute top-[-60px] right-[-40px] hidden h-56 w-56 items-center justify-center rounded-full bg-[radial-gradient(circle,#ffffff_0%,#5f5bff_42%,#7d4cff_68%,transparent_72%)] text-7xl font-black text-white shadow-[0_0_76px_rgba(89,82,255,0.5)] lg:flex">
                S
              </div>
              {insights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex max-w-[540px] items-start gap-6">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-[#111733]">{item.title}</h2>
                      <p className="mt-2 text-base leading-7 font-medium text-[#5c6889]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-[520px] rounded-lg border border-[#e2e6f7] bg-white/56 p-5 shadow-[0_18px_46px_rgba(60,67,128,0.08)] backdrop-blur">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef0ff] text-[#4f58ff]">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-[#4f58ff]">Tus datos están protegidos</p>
                <p className="mt-1 text-sm font-medium text-[#6d7899]">
                  Seguridad de nivel empresarial con cifrado avanzado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-[720px]">
          {children}
          <div className="mt-9 text-center text-sm font-medium text-[#8490ad]">{footer}</div>
          <p className="mt-16 text-center text-sm font-medium text-[#8a94ad]">
            © 2026 SISGO SpA. Todos los derechos reservados.
          </p>
        </div>
      </section>
    </main>
  );
}
