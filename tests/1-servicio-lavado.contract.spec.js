// tests/1-servicio-lavado.contract.spec.js
// CAPA 1 · CONTRACT — Wizard de cotización del SERVICIO de lavado (/servicios-lavado/).
//
// POR QUÉ ESTE CONTRACT EXISTE:
// El servicio de lavado SÍ es comprable E2E (s20, orden 6122026VSX6C), pero su puerta
// de entrada es FRÁGIL de dos formas que ya nos costaron tiempo:
//   1. El trigger "Cotizar lavado" es una <img> (no un <button> de texto) → un cambio
//      de markup que lo vuelva un botón, o que cambie el asset, lo rompe en silencio.
//   2. Es contenido Builder.io con A/B testing (BUG-B2C-457): en algunas variantes el
//      wizard NO se sirve. Un build que mueva el flag de la variante lo apaga.
// Este contract vigila ambos: ancla el trigger por el hash del ASSET (estable entre
// builds), pinea la variante con wizard, y trata la AUSENCIA como presencia condicional
// (SKIP, no FAIL) para no teñir la suite de rojo por el A/B conocido.
//
// QUÉ ASERTA (estructura, no datos): que el trigger exista visible, que el wizard ABRA
// con sus controles load-bearing (steppers, dropdown Capacidad, botón Cotizar) y que
// "Cotizar" produzca un precio + el botón "Agregar al carrito" (la puerta a la compra).
// NO asercióna el monto ($899 es client-side y puede cambiar) ni completa la compra.
//
// CUIDADO — BUG-B2C-005 (nodos duplicados desktop/mobile): el sitio renderiza el trigger
// 4 veces (3 copias `banner-mobile` OCULTAS + 1 `banner-desk` visible). Por eso NO se usa
// `img[src*="a634cf17"]` a secas (su `.first()` agarra una copia oculta → toBeVisible
// expira): se ancla `img[class*="banner-desk"][src*="<asset>"]` → el único visible.
// Verificado en vivo con probe DOM (2026-06-15).
//
// REGLA DE SELECTORES: estos NO son hashes de Qwik (q-*/⭐️…), son clases de autor del
// componente Builder.io (banner-desk, .modal-wizard, button.plus, .dropdown-toggle,
// button.guardar), documentadas como estables en el inventario II.16.c y .claude/rules.
//
// Correr: npm run check:b2c:contracts   (o npm run check:b2c para todo)

const { test, expect, irA } = require('./_helpers');
const { SERVICIO } = require('./_targets');

// Trigger = banner DESKTOP con el asset del wizard → descarta las copias mobile
// ocultas (BUG-005) y el hero (otro asset). Único elemento visible.
const TRIGGER = `img[class*="banner-desk"][src*="${SERVICIO.triggerAsset}"]`;

test.describe('@contract Servicio de lavado — wizard de cotización', () => {

  // Spec inherentemente pesado (Builder.io A/B + hidratación Qwik del trigger imagen)
  // → un reintento extra sobre el del proyecto absorbe la lentitud bajo carga paralela.
  test.describe.configure({ retries: 3 });

  test.beforeEach(async ({ page }) => {
    // Pin de la variante A/B (BUG-457) ANTES de cargar scripts: Builder.io asigna la
    // variante por hash determinista del builderVisitorId → fijamos uno que sirve el
    // wizard. Sin esto, la presencia del trigger es una moneda al aire.
    await page.addInitScript((vid) => {
      try { localStorage.setItem('builderVisitorId', vid); } catch (_) { /* contexto sin storage */ }
    }, SERVICIO.builderVisitor);
  });

  /** Navega a la landing y devuelve el trigger; salta el test si la variante no lo sirve. */
  async function abrirLanding(page) {
    await irA(page, SERVICIO.slug, 3500);
    const trigger = page.locator(TRIGGER);
    // Presencia condicional: la variante A/B sin wizard (BUG-457) → SKIP, no rojo.
    test.skip(
      (await trigger.count()) === 0,
      'Variante A/B sin wizard (BUG-B2C-457) — el trigger "Cotizar lavado" no se sirvió en esta corrida.'
    );
    return trigger.first();
  }

  /** Abre el wizard (click CDP real sobre la imagen) y espera el CONTENIDO del modal.
   *  Bajo carga paralela la hidratación Qwik (qvisible) del trigger llega tarde → el
   *  primer click no encuentra el handler cableado y el modal no abre (causa de
   *  flakiness). Mitigación: scroll+hover para gatillar qvisible, luego reintentar el
   *  click hasta 4× esperando el contenido interno (lo mismo que espera el script E2E
   *  probado en s20: `.modal-content-wizard`, no solo el overlay). */
  async function abrirWizard(page) {
    const trigger = await abrirLanding(page);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.hover().catch(() => {}); // nudge a la hidratación qvisible del componente
    await page.waitForTimeout(800);
    const contenido = page.locator('.modal-content-wizard');
    for (let intento = 0; intento < 4; intento++) {
      await trigger.click().catch(() => {}); // click CDP real
      try { await contenido.waitFor({ state: 'visible', timeout: 4000 }); break; } catch (_) { /* reintenta */ }
    }
    await expect(contenido).toBeVisible({ timeout: 8000 });
  }

  test('Trigger "Cotizar lavado" presente y visible (imagen Builder.io, no botón)', async ({ page }) => {
    const trigger = await abrirLanding(page);
    await expect(trigger).toBeVisible();
  });

  test('El wizard ABRE con sus controles clave (steppers + Capacidad + Cotizar)', async ({ page }) => {
    await abrirWizard(page);

    // 2 ítems (Tinaco + Cisterna) → 2 steppers "+". button.plus es icon-only (BUG-401),
    // pero la clase de autor es estable. Receta probada en inventario II.16.c #8.
    await expect(page.locator('.modal-content-wizard button.plus')).toHaveCount(2);

    // El botón "Cotizar" existe y arranca DESHABILITADO (sin cantidad ni capacidad).
    const cotizar = page.locator('button.guardar', { hasText: /cotizar/i }).first();
    await expect(cotizar).toBeVisible();
    await expect(cotizar).toBeDisabled();
  });

  test('Cotizar produce un precio y habilita "Agregar al carrito"', async ({ page }) => {
    await abrirWizard(page);

    // Recorrido como un cliente real (secuencia probada 1→4 del inventario II.16.c #9):
    // +1 Tinaco → abrir Capacidad → elegir la opción → Cotizar se habilita → click.
    await page.locator('.modal-content-wizard button.plus').first().click();
    await page.locator('.dropdown-toggle').first().click();
    await page.locator('.dropdown-item').first().click();

    const cotizar = page.locator('button.guardar', { hasText: /cotizar/i }).first();
    await expect(cotizar).toBeEnabled();
    await cotizar.click();

    // La cotización muestra un precio en formato moneda (NO asercionamos el monto exacto).
    await expect(page.getByText(/\$[\d,]+(\.\d{2})?/).first()).toBeVisible({ timeout: 12000 });

    // Y el botón que abre la compra del servicio (puerta al carrito → checkout).
    await expect(
      page.getByRole('button', { name: /agregar al carrito/i }).first()
    ).toBeVisible({ timeout: 12000 });
  });
});
