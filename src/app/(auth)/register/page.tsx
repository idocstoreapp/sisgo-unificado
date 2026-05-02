/**
 * Register page - company registration wizard entry point
 */

import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/presentation/components/auth/AuthShell";
import { RegisterForm } from "@/presentation/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-black text-[#4f58ff] hover:text-[#2734ff]">
            Inicia sesión
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-[#6d7899]">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
