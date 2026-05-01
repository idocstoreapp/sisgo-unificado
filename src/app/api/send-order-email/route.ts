import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type SendOrderEmailBody = {
  to?: string;
  customerName?: string;
  orderNumber?: string;
  pdfBase64?: string | null;
  pdfUrl?: string | null;
  branchName?: string | null;
  branchEmail?: string | null;
  emailType?: "order_created" | "ready_for_pickup";
};

const FROM_EMAIL = "info@app.idocstore.cl";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENT_BASE64_LENGTH = 4 * 1024 * 1024;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(
  body: Required<Pick<SendOrderEmailBody, "emailType">> & SendOrderEmailBody,
) {
  const customerName = escapeHtml(body.customerName || "Cliente");
  const orderNumber = escapeHtml(body.orderNumber);
  const branchName = body.branchName ? escapeHtml(body.branchName) : "";
  const branchEmail = body.branchEmail ? escapeHtml(body.branchEmail) : "";
  const pdfUrl = body.pdfUrl ? escapeHtml(body.pdfUrl) : "";

  if (body.emailType === "ready_for_pickup") {
    return {
      subject: `Notificacion: Orden ${body.orderNumber} - Equipo listo para retirar`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="margin: 0;">iDocStore</h1>
                <p style="margin: 8px 0 0;">Su equipo esta listo</p>
              </div>
              <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
                <h2>Estimado/a ${customerName},</h2>
                <p>Su equipo esta listo para retirar.</p>
                <div style="text-align: center; margin: 20px 0;">
                  <span style="background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">Orden: ${orderNumber}</span>
                </div>
                <p>Puede retirar su equipo en nuestra sucursal durante el horario de atencion. No olvide traer su documento de identidad.</p>
                ${branchName ? `<p><strong>Sucursal:</strong> ${branchName}</p>` : ""}
                ${branchEmail ? `<p><strong>Email:</strong> ${branchEmail}</p>` : ""}
                <p>Atentamente,<br><strong>Equipo iDocStore</strong></p>
              </div>
              <p style="font-size: 12px; color: #6b7280; text-align: center;">Este es un correo automatico, por favor no responda a este mensaje.</p>
            </div>
          </body>
        </html>
      `,
    };
  }

  return {
    subject: `Notificacion: Orden ${body.orderNumber} - Equipo ingresado`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">iDocStore</h1>
              <p style="margin: 8px 0 0;">Servicio especializado en reparacion</p>
            </div>
            <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px;">
              <h2>Estimado/a ${customerName},</h2>
              <p>Su equipo ha sido ingresado con exito en nuestro sistema.</p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">Orden: ${orderNumber}</span>
              </div>
              ${
                pdfUrl
                  ? `<p>Puede descargar el PDF con los detalles de su orden en el siguiente enlace:</p>
                     <div style="text-align: center; margin: 20px 0;">
                       <a href="${pdfUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Descargar PDF de la orden</a>
                     </div>`
                  : body.pdfBase64
                    ? "<p>Adjuntamos el PDF con los detalles de su orden.</p>"
                    : "<p>Su orden ya fue registrada. Si necesita una copia del PDF, puede solicitarla directamente en la sucursal.</p>"
              }
              <ul>
                <li>Informacion del equipo ingresado</li>
                <li>Servicios solicitados</li>
                <li>Presupuesto detallado</li>
                <li>Politicas de garantia</li>
                <li>Datos de contacto de nuestra sucursal</li>
              </ul>
              <p>Nuestro equipo tecnico revisara su equipo y se pondra en contacto con usted en caso de ser necesario.</p>
              ${branchName ? `<p><strong>Sucursal:</strong> ${branchName}</p>` : ""}
              <p>Atentamente,<br><strong>Equipo iDocStore</strong></p>
            </div>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Este es un correo automatico, por favor no responda a este mensaje.</p>
          </div>
        </body>
      </html>
    `,
  };
}

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });
    }

    const body = (await request.json()) as SendOrderEmailBody;
    const emailType = body.emailType || "order_created";

    if (!body.to || !body.orderNumber) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: to, orderNumber" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(body.to)) {
      return NextResponse.json(
        { error: `Email del destinatario invalido: ${body.to}` },
        { status: 400 },
      );
    }

    const fromName = body.branchName ? `${body.branchName} - iDocStore` : "iDocStore";
    const { subject, html } = buildEmailHtml({ ...body, emailType });
    const emailData: Parameters<Resend["emails"]["send"]>[0] = {
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [body.to],
      subject,
      html,
      headers: {
        "X-Priority": "1",
        Importance: "high",
        "X-Auto-Response-Suppress": "All",
        "X-Mailer": "iDocStore-Order-System",
      },
      tags: [
        { name: "transactional", value: "order-notification" },
        { name: "order-number", value: body.orderNumber },
      ],
    };

    if (
      body.pdfBase64 &&
      !body.pdfUrl &&
      emailType === "order_created" &&
      body.pdfBase64.length <= MAX_ATTACHMENT_BASE64_LENGTH
    ) {
      emailData.attachments = [
        {
          filename: `orden-${body.orderNumber}.pdf`,
          content: body.pdfBase64,
        },
      ];
    }

    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send(emailData);

    if (result.error) {
      return NextResponse.json(
        {
          error: result.error.message || "Error enviando email",
          details: result.error.name || "Error desconocido",
          from: FROM_EMAIL,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email enviado exitosamente",
      emailId: result.data?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const details = error instanceof Error ? error.name : "Error desconocido";

    return NextResponse.json(
      {
        error: message,
        details,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
