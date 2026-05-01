import { NextResponse } from "next/server";

interface SendOrderEmailPayload {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendOrderEmailPayload;

    if (!body.to || !body.subject || (!body.html && !body.text)) {
      return NextResponse.json(
        { ok: false, message: "Payload incompleto para envío de correo." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Simulación de envío correcta. Integra Resend/SMTP para producción.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}
