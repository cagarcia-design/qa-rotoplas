// tests/9-centinelas.contract.spec.js
// CALIDAD TRANSVERSAL · CENTINELAS DE BLOQUEOS EXTERNOS.
//
// FILOSOFÍA (auditoría s29): un "bloqueo" puede ser de dos tipos.
//   • FRAGILIDAD DISOLUBLE → se ARREGLA, no se vigila (ej. BUG-457 wizard A/B se
//     disolvió pineando builderVisitorId; el SKU hardcodeado se disolvió tomando
//     el primer producto dinámicamente). Esos NO viven aquí: viven como flujo real.
//   • MURO EXTERNO genuino → el fix NO es nuestro (bug del sitio, gate de
//     fulfillment real, falta de inbox en prod). Para esos, lo honesto NO es
//     esconderlos en una nota: es un CENTINELA ejecutable que (a) cubre la parte
//     NO-rota de verdad y (b) deja la parte rota como guard que se pone VERDE solo
//     el día que el muro cae. Así el bloqueo es VIGILADO, no invisible.
//
// Tag: @bloqueo   (transversal, fuera del mapa por área — como @xcut / @perf)
// Correr: npm run check:b2c:bloqueos

const { test, expect, irA, bugConocido } = require('./_helpers');

// ─────────────────────────────────────────────────────────────────────────
// BUG-B2C-566 — Reseñas E2E rotas (bug del SITIO, no nuestro).
// Parte NO-rota que SÍ cubrimos: que /customer/reviews renderice (auth).
// Parte rota (enviar reseña que persista) = guard que flippea al arreglarse.
// ─────────────────────────────────────────────────────────────────────────
test.describe('@bloqueo @auth Reseñas — /customer/reviews', () => {

  test('La página de reseñas renderiza (parte no-rota)', async ({ page }) => {
    await irA(page, '/customer/reviews');
    // Sin sesión el sitio redirige a /login → skip limpio (ámbar), no rojo.
    test.skip(/\/login/.test(page.url()), 'Sin sesión B2C (@auth) — genera sesión y reintenta.');
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    expect((await body.textContent()) || '').not.toMatch(/Ha ocurrido un error/i);
  });

  bugConocido(test, 'BUG-B2C-566',
    'Enviar una reseña debería persistir y mostrarla (hoy el flujo E2E está roto)',
    async ({ page }) => {
      // Invariante DESEADO: existe el control para crear una reseña en el área de
      // cliente. Hoy falla (flujo roto). Si PASA → el sitio lo arregló → cerrar.
      await irA(page, '/customer/reviews');
      await expect(
        page.getByRole('button', { name: /escribir|crear|nueva rese[ñn]a|calificar/i }).first()
      ).toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────────────────
// CAPA 2 — Correo "Tu pedido fue entregado": NO reproducible vía CT API.
// El trigger es fulfillment real (portal B2B + imagen de prueba de entrega), no un
// cambio de estado CT. No es gap nuestro; es un gate externo. Centinela documental.
// ─────────────────────────────────────────────────────────────────────────
test.describe('@bloqueo Capa 2 — correo de entrega', () => {
  test.fixme('shipmentState → Delivered dispara "Tu pedido fue entregado" (gate de fulfillment real, no vía CT)', async () => {
    // Cuando exista una vía QA para forzar la entrega real (o un stub del gate),
    // implementar aquí la verificación vía Gmail MCP. Hoy: vigilado, no automatizable.
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Forgot-password en PRODUCCIÓN — el camino feliz (correo de reset llega) requiere
// inbox accesible (IMAP) + cuenta registrada. En QA SÍ se cubre (4-forms-email
// @email). En prod no hay inbox de la cuenta de prueba → no verificable. La parte
// NO-rota (la página valida y dispara el submit) ya la cubre 1-forms en ambos.
// ─────────────────────────────────────────────────────────────────────────
test.describe('@bloqueo Forgot-password — verificación de correo en prod', () => {
  test.fixme('Forgot válido → correo de reset llega (solo verificable en QA con IMAP, no en prod)', async () => {
    // El happy-path con inbox vive en 4-forms-email.smoke.spec.js (@email, QA).
    // En prod queda como centinela: sin inbox de la cuenta de prueba.
  });
});
