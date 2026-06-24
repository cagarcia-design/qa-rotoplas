// tests/7-servicios-flujo.contract.spec.js
// FLUJO DE ÁREA · SERVICIOS — cotización del servicio de lavado → entra al carrito.
//
// POR QUÉ EXISTE / CÓMO DISUELVE UN "BLOQUEO" (auditoría s29):
// El Flujo de Servicios estaba ⏳ "bloqueado" por dos razones que se confundían:
//   (a) zona A/B inestable (BUG-B2C-457): el wizard a veces no se sirve.
//   (b) "requiere pago real" → mutante.
// Pero (a) NO es un muro externo: es FRAGILIDAD disoluble — Builder.io asigna la
// variante por hash determinista del builderVisitorId, así que PINEAR uno
// conocido-bueno fija la variante CON wizard (mismo patrón que seedCobertura para
// la PDP, o que dejar de hardcodear el SKU en health). Y (b) no aplica a la
// COTIZACIÓN: cotizar + agregar al carrito NO paga nada (el carrito es de sesión,
// efímero en un contexto anónimo fresco). Solo el checkout/pago sería mutante.
// → Con el pin, este flujo es DETERMINISTA y corrible. Deja de ser ⏳.
//
// QUÉ VERIFICA (efecto, no estructura): que cotizar produzca el servicio EN EL
// CARRITO (line-item del SKU 452308 "Mantenimiento Tinaco"). Eso es "hace lo que
// promete", un paso más allá del contract de estructura (1-servicio-lavado), que
// solo llega a "el botón Agregar al carrito aparece".
//
// Si la variante A/B no sirve el trigger pese al pin → SKIP (no rojo): presencia
// condicional, como el contract de estructura.
//
// Tag: @flserv   (POR ÁREA, sin @flujo para no mezclar con el flujo de PDP)
// Correr: npm run check:b2c:servicios:flujo

const { test, expect, irA } = require('./_helpers');
const { SERVICIO } = require('./_targets');

const TRIGGER = `img[class*="banner-desk"][src*="${SERVICIO.triggerAsset}"]`;

test.describe('@flserv Servicios — cotización → carrito', () => {

  // Builder.io A/B + hidratación Qwik del trigger imagen → reintentos extra.
  test.describe.configure({ retries: 3 });

  test.beforeEach(async ({ page }) => {
    // Pin de la variante CON wizard (BUG-457) antes de cargar scripts.
    await page.addInitScript((vid) => {
      try { localStorage.setItem('builderVisitorId', vid); } catch (_) { /* sin storage */ }
    }, SERVICIO.builderVisitor);
  });

  test('Cotizar el servicio lo deja en el carrito (SKU 452308)', async ({ page }) => {
    await irA(page, SERVICIO.slug, 3500);

    const trigger = page.locator(TRIGGER);
    test.skip(
      (await trigger.count()) === 0,
      'Variante A/B sin wizard (BUG-B2C-457) — el trigger no se sirvió pese al pin.'
    );

    // Abrir el wizard: click CDP real, reintentando hasta que monte el contenido
    // (la hidratación qvisible del trigger imagen llega tarde bajo carga paralela).
    const t = trigger.first();
    await t.scrollIntoViewIfNeeded();
    await t.hover().catch(() => {});
    await page.waitForTimeout(800);
    const contenido = page.locator('.modal-content-wizard');
    for (let i = 0; i < 4; i++) {
      await t.click().catch(() => {});
      try { await contenido.waitFor({ state: 'visible', timeout: 4000 }); break; } catch (_) { /* reintenta */ }
    }
    await expect(contenido).toBeVisible({ timeout: 8000 });

    // Recorrido de cliente (secuencia probada, inventario II.16.c #9):
    // +1 Tinaco → Capacidad → opción → Cotizar habilita → Cotizar → Agregar al carrito.
    await page.locator('.modal-content-wizard button.plus').first().click();
    await page.locator('.dropdown-toggle').first().click();
    await page.locator('.dropdown-item').first().click();

    const cotizar = page.locator('button.guardar', { hasText: /cotizar/i }).first();
    await expect(cotizar).toBeEnabled();
    await cotizar.click();

    const agregar = page.getByRole('button', { name: /agregar al carrito/i }).first();
    await expect(agregar).toBeVisible({ timeout: 12000 });
    await agregar.click();

    // EFECTO: el servicio quedó en el carrito. Verificamos en /cart el line-item
    // del servicio (SKU 452308 "Mantenimiento Tinaco" — .service-card, inventario II.16.d).
    await irA(page, '/cart/', 3000);
    await expect(
      page.locator('.service-card')
        .or(page.getByText(/mantenimiento tinaco/i))
        .first(),
      'El servicio cotizado no apareció como line-item en el carrito.'
    ).toBeVisible({ timeout: 10000 });
  });
});
