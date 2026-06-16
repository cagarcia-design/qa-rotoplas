// tests/contracts/b2c/_email.js
// VERIFICACIÓN DE CORREO PARA EL CHECK CAPA 2 (qarotoplasmx.io).
//
// EL RETO QUE RESUELVE ESTE ARCHIVO:
// Un spec de Playwright corre en un proceso Node. Node NO puede llamar al Gmail
// MCP (las herramientas MCP solo existen para el agente Claude). Por eso, para que
// el check Capa 2 sea AUTÓNOMO (corra en CI sin un humano/agente en el loop), la
// lectura del inbox debe hacerse con credenciales NATIVAS de Node.
//
// DOS MODOS (el spec se escribe UNA vez contra la interfaz waitForEmail; solo
// cambia el backing):
//   • Modo B — AUTÓNOMO (este archivo): IMAP sobre el inbox c.agarcia@rotoplas.com.
//       Requiere en .env:  GMAIL_IMAP_USER + GMAIL_IMAP_PASS  (App Password de Google)
//       y la dependencia `imapflow` (npm i imapflow).
//   • Modo A — ORQUESTADO POR AGENTE (sin setup): el spec emite el orderNumber y los
//       asuntos esperados; el agente Claude verifica con Gmail MCP. Útil para una
//       primera prueba end-to-end hoy. (No vive en código: es un runbook.)
//
// CONTRATO DE LA INTERFAZ (estable — no cambia entre modos):
//   waitForEmail({ subject, from, sinceTs, bodyIncludes, timeoutMs, pollMs })
//     → Promise<{ found:true, subject, date, uid }>  si llega a tiempo
//     → lanza Error descriptivo si vence el timeout
//   emailCredsDisponibles()  → boolean (para test.skip cuando no hay credenciales)
//
// DECISIONES DE DISEÑO QUE CARGAN PESO:
//   1. POLLING CON TIMESTAMP. El correo llega en segundos pero ASÍNCRONO. Anclamos
//      la búsqueda a `sinceTs` (tomado JUSTO antes de disparar la transición) para
//      no confundir un correo viejo de la misma plantilla con el recién disparado.
//   2. DOBLE ANCLAJE. Filtramos por asunto (regex) Y, si se da, por `bodyIncludes`
//      (el orderNumber en el cuerpo) → evita falsos positivos cuando corren varias
//      órdenes a la vez sobre la misma cuenta.
//   3. LAZY REQUIRE de imapflow dentro de la función → el módulo IMPORTA aunque la
//      dependencia no esté instalada; solo falla (con mensaje claro) al USARSE.

const REMITENTE_B2C = 'ventasecom@rotoplas.com'; // remitente de los correos transaccionales B2C

/** ¿Están las credenciales IMAP en el entorno? Si no, el check Capa 2 hace skip. */
function emailCredsDisponibles() {
  return Boolean(process.env.GMAIL_IMAP_USER && process.env.GMAIL_IMAP_PASS);
}

/**
 * Espera (con polling) a que un correo que cumpla los criterios aparezca en el inbox.
 *
 * @param {object}   opts
 * @param {RegExp|string} opts.subject       asunto esperado (regex recomendado)
 * @param {string}  [opts.from]              remitente (default: ventasecom@rotoplas.com)
 * @param {number}  [opts.sinceTs]           epoch ms; ignora correos anteriores (default: hace 5 min)
 * @param {string}  [opts.bodyIncludes]      string que el cuerpo debe contener (ej. orderNumber)
 * @param {number}  [opts.timeoutMs=90000]   cuánto esperar antes de declarar "no llegó"
 * @param {number}  [opts.pollMs=5000]       cada cuánto re-consultar el inbox
 * @returns {Promise<{found:true, subject:string, date:Date, uid:number}>}
 */
async function waitForEmail({
  subject,
  from = REMITENTE_B2C,
  sinceTs = Date.now() - 5 * 60 * 1000,
  bodyIncludes,
  timeoutMs = 90000,
  pollMs = 5000,
} = {}) {
  if (!emailCredsDisponibles()) {
    throw new Error(
      'waitForEmail: faltan credenciales IMAP. Define GMAIL_IMAP_USER y GMAIL_IMAP_PASS ' +
      'en .env (App Password de Google para el inbox c.agarcia@rotoplas.com), o corre ' +
      'el check en Modo A (verificación por agente).'
    );
  }

  let ImapFlow;
  try {
    ({ ImapFlow } = require('imapflow'));
  } catch (_) {
    throw new Error('waitForEmail: falta la dependencia `imapflow`. Corre:  npm i imapflow');
  }

  const subjectRe = subject instanceof RegExp ? subject : new RegExp(String(subject), 'i');
  const sinceDate = new Date(sinceTs);
  const deadline = Date.now() + timeoutMs;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: process.env.GMAIL_IMAP_USER, pass: process.env.GMAIL_IMAP_PASS },
    logger: false,
  });

  await client.connect();
  try {
    while (Date.now() < deadline) {
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Buscamos por remitente + fecha (filtro barato del lado servidor); el
        // asunto/cuerpo se afinan del lado cliente para soportar regex.
        const uids = await client.search({ from, since: sinceDate }, { uid: true });
        for (const uid of uids.reverse()) { // más recientes primero
          const msg = await client.fetchOne(uid, { envelope: true, source: Boolean(bodyIncludes) }, { uid: true });
          if (!msg) continue;
          const asunto = msg.envelope?.subject || '';
          if (!subjectRe.test(asunto)) continue;
          if (bodyIncludes) {
            const cuerpo = msg.source ? msg.source.toString('utf8') : '';
            if (!cuerpo.includes(bodyIncludes)) continue;
          }
          return { found: true, subject: asunto, date: msg.envelope?.date, uid };
        }
      } finally {
        lock.release();
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
  } finally {
    await client.logout().catch(() => {});
  }

  throw new Error(
    `waitForEmail: no llegó un correo de "${from}" con asunto ${subjectRe} ` +
    (bodyIncludes ? `que contenga "${bodyIncludes}" ` : '') +
    `dentro de ${timeoutMs} ms (desde ${sinceDate.toISOString()}).`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ CONTRATO DE ORQUESTACIÓN (probado en vivo 2026-06-10, orden 682026ZF0AN).
// El microservicio de correo aparenta NOTIFICAR-UNA-VEZ por estado: si las
// transiciones se disparan en ráfaga, los correos posteriores se PIERDEN, y una
// vez "quemado" un estado, re-disparar (incluso regresándolo) ya no reenvía.
// Por tanto el check @capa2 DEBE:
//   1. Usar una orden FRESCA por corrida (no reutilizar/regresar órdenes).
//   2. Disparar la transición → ESPERAR su correo con waitForEmail → recién
//      entonces disparar la siguiente. NUNCA disparar transiciones en ráfaga.
// Evidencia: tickets/regresiones-smoke-b2c/evidencias/CAPA2-modoA-proof-682026ZF0AN.md
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// MAPA CT event → asunto de correo esperado (confirmado en CLAUDE.md / s15-s16).
// El spec Capa 2 usa esto tras cada transición para saber QUÉ correo esperar.
// Asuntos como regex tolerante (las plantillas varían en mayúsculas/acentos).
// ─────────────────────────────────────────────────────────────────────────
// Probado en vivo 2026-06-10 (2 órdenes controladas, ver evidencia). Existen 5 plantillas
// de correo, pero NO todas se reproducen moviendo el estado vía CT en una orden B2C.
//
// ✅ REPRODUCIBLE vía CT (lo que el check @capa2 asierte):
const CORREO_REPRODUCIBLE = {
  ordenCreada:     /pedido est[áa] en proceso/i,   // al crear la orden (~4 s)
  stateConfirmed:  /pedido fue confirmado/i,        // orderState → Confirmed (~4 s)
  shipmentShipped: /pedido est[áa] en camino/i,     // shipmentState → Shipped (~3 s)
};
// 🔎 REPRODUCIBLE-CANDIDATO (probado 1x en s18, orden 6102026LQSK7 — CORRIGE s17):
//    "punto de entrega" SÍ se dispara, pero el trigger es shipmentState → **Pending**
//    (su label CT es "En Punto de Entrega"), NO `Ready`. s17 concluyó "no reproducible"
//    porque movió el estado equivocado. Disparó en ~2 s. → Subir a CORREO_REPRODUCIBLE
//    y asertar en el spec tras una 2ª confirmación independiente.
const CORREO_REPRODUCIBLE_CANDIDATO = {
  shipmentEnPunto: /pedido est[áa] en punto de entrega/i, // shipmentState → Pending (~2 s, 1x)
};
// ❌ NO reproducible vía CT — POR DISEÑO (incógnita RESUELTA en s18, retest aislado
//    sobre orden 6112026B6IX5: Shipped→Delivered directo, espera 60 s, "entregado" NO llegó).
//    ROOT CAUSE (confirmado por el usuario): avanzar una orden B2C a "Entregado" se hace
//    desde el PORTAL B2B (según el distribuidor asignado) y el portal EXIGE subir una
//    IMAGEN DE PRUEBA DE ENTREGA (PNG/JPG) antes de permitir el avance. El correo dispara
//    sobre ese evento real de fulfillment (con la imagen), NO sobre el cambio crudo de
//    shipmentState→Delivered en CT. Las órdenes que sí recibieron "entregado" (692026RZT3G)
//    se avanzaron por el portal real. → Irreproducible vía CT; queda fuera del check.
const CORREO_NO_REPRODUCIBLE_VIA_CT = {
  shipmentDelivered: /pedido fue entregado/i,
};
// Mapa completo de asuntos (para búsquedas), sin implicar reproducibilidad.
const CORREO_POR_TRANSICION = {
  ...CORREO_REPRODUCIBLE, ...CORREO_REPRODUCIBLE_CANDIDATO, ...CORREO_NO_REPRODUCIBLE_VIA_CT,
};
// Nota: orderState → Complete NO dispara correo.

module.exports = {
  waitForEmail, emailCredsDisponibles, REMITENTE_B2C,
  CORREO_REPRODUCIBLE, CORREO_REPRODUCIBLE_CANDIDATO,
  CORREO_NO_REPRODUCIBLE_VIA_CT, CORREO_POR_TRANSICION,
};
