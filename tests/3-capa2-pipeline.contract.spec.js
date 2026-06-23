// tests/3-capa2-pipeline.contract.spec.js
// CAPA 2 · @capa2 — Pipeline de notificaciones ORQUESTADO (CT → correo).
//
// QUÉ HACE: sobre una orden, mueve el status vía Commercetools y verifica que el
// correo transaccional correcto llega al inbox. Es la verificación del EFECTO
// EXTERNO REAL (Capa 2), no solo estructura.
//
// ⚠️ TIER LENTO Y CON EFECTOS — NO corre con los contracts rápidos (@health/@contract).
//   Muta el estado de una orden y dispara correos reales. Correr aparte:
//      npm run check:b2c:capa2
//
// REQUISITOS (ver README §Capa 2):
//   1. CAPA2_ORDER = nº de una orden B2C FRESCA en estado Open (sus estados aún no
//      "quemados"). El check NO crea la orden (Pieza 1 pendiente: UI o script Modo B).
//   2. Credenciales IMAP para waitForEmail (Modo B): GMAIL_IMAP_USER / GMAIL_IMAP_PASS.
//      Sin ellas → skip (en Modo A la verificación de correo la hace el agente).
//
// CONTRATO DE ORQUESTACIÓN (probado en vivo 2026-06-10, ver evidencia + _email.js):
//   - Disparo SECUENCIAL: transición → esperar su correo → recién la siguiente.
//     Disparar en ráfaga PIERDE correos (el microservicio notifica-una-vez por estado).
//   - Solo se asertan las transiciones REPRODUCIBLES vía CT (confirmado, en camino).
//     "punto de entrega"/"entregado" NO se reproducen moviendo shipmentState aquí
//     → fuera del check para no introducir falsos rojos.

const path = require('path');
const { test, expect } = require('@playwright/test');
const { waitForEmail, emailCredsDisponibles, CORREO_REPRODUCIBLE } = require('./_email');
const ct = require('../scripts/ct-api');

const ORDER = process.env.CAPA2_ORDER;

test.describe('@capa2 Pipeline de notificaciones (CT → correo)', () => {
  // Skips honestos: sin credenciales o sin orden fresca, no se puede verificar.
  test.skip(!emailCredsDisponibles(),
    'Sin credenciales IMAP (Modo B). Define GMAIL_IMAP_USER/GMAIL_IMAP_PASS, o corre en Modo A.');
  test.skip(!ORDER,
    'Falta CAPA2_ORDER (nº de orden B2C fresca en Open). Crear una y exportarla: CAPA2_ORDER=68... ');

  // Mismo worker, en orden: las transiciones son secuenciales por diseño (ver contrato).
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180000); // el polling de correo puede tardar hasta ~90 s por paso

  test('orderState → Confirmed dispara "Tu pedido fue confirmado"', async () => {
    const t0 = Date.now();
    await ct.setB2COrderState(ORDER, 'Confirmed');
    const mail = await waitForEmail({
      subject: CORREO_REPRODUCIBLE.stateConfirmed,
      sinceTs: t0,
      bodyIncludes: ORDER, // doble anclaje: el nº de orden en el cuerpo
    });
    expect(mail.found, 'No llegó el correo de confirmación').toBe(true);
  });

  test('shipmentState → Shipped dispara "Tu pedido esta en camino"', async () => {
    const t0 = Date.now();
    await ct.setB2CShipmentState(ORDER, 'Shipped');
    const mail = await waitForEmail({
      subject: CORREO_REPRODUCIBLE.shipmentShipped,
      sinceTs: t0,
      bodyIncludes: ORDER,
    });
    expect(mail.found, 'No llegó el correo de "en camino"').toBe(true);
  });
});
