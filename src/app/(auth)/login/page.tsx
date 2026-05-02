/**
 * Login page - email/password authentication
 */

import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/presentation/components/auth/AuthShell";
import { LoginForm } from "@/presentation/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-black text-[#4f58ff] hover:text-[#2734ff]">
            Regístrate aquí
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-[#6d7899]">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
