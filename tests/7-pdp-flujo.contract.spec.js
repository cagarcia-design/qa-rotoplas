// tests/7-pdp-flujo.contract.spec.js
// CAPA 1 (N1) · @flujo — Profundidad de Catálogo/PDP: que la PDP no solo RENDERICE
// (eso lo cubre 1-pdp) sino que sus piezas FUNCIONEN. Eleva la celda "Flujo" del área
// Catálogo/PDP de ⏳ a N1 en el panel.
//
// Producto de prueba: 310002 "Base para tinaco GDPV" — DISPONIBLE para CP 02800. Se siembra
// la cobertura (localStorage) → la PDP queda determinista (disponible, precio, compra
// habilitada) sin caminar el modal de CP. Ver hallazgo F6 #1 en overview.
//
// QUÉ ASERTA (lo que 2-money-path NO cubre; add-to-cart que PERSISTE ya vive allí @auth):
//   1. GALERÍA muestra ESTE producto — alguna imagen de la galería trae el SKU del producto
//      (no cross-sell — BUG-316 es específico del SKU 500545, no de 310002. Ver overview #3).
//   2. ACORDEONES nativos <details> ABREN — Descripción y Especificaciones técnicas
//      (a11y correcta confirmada, BUG-336). Selectores del inventario §II.8 (Parte VI).
//   3. DISPONIBILIDAD POR CP habilita la compra — con cobertura sembrada NO aparece
//      "No disponible para C.P." y el CTA `button.buy` queda habilitado.
//
// Anónimo + seed (no requiere @auth): solo la PERSISTENCIA del carrito necesita sesión, no
// que la PDP funcione. Por eso corre en el run rápido / regresión.
//
// Tag: @flujo @contract · Correr: npx playwright test --grep @flujo

const { test, expect, irA, seedCobertura } = require('./_helpers');
const { PRODUCTO, COBERTURA_SEED } = require('./_targets');

test.describe('@flujo @contract Catálogo/PDP a fondo (N1)', () => {
  test.beforeEach(async ({ page }) => {
    await seedCobertura(page, COBERTURA_SEED);
  });

  test('Galería muestra ESTE producto (imagen con su SKU)', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    const srcs = await page.locator('main img').evaluateAll((imgs) => imgs.map((i) => i.currentSrc || i.src || ''));
    expect(
      srcs.some((s) => s.includes(PRODUCTO.sku)),
      `ninguna imagen de la galería corresponde al SKU ${PRODUCTO.sku} (galería contaminada o vacía)`
    ).toBeTruthy();
  });

  test('Acordeones nativos <details> abren (Descripción · Especificaciones)', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    const desc = page.locator('details:has-text("Descripción")').first();
    const specs = page.locator('details:has-text("Especificaciones")').first();
    await expect(desc, 'falta el acordeón "Descripción"').toBeVisible();
    await expect(specs, 'falta el acordeón "Especificaciones técnicas"').toBeVisible();
    // Abrir Descripción por su <summary> → el <details> queda `open` (contenido expandido).
    await desc.locator('summary').first().click();
    await expect(desc).toHaveAttribute('open', /.*/);
  });

  test('Disponibilidad por CP habilita la compra (cobertura sembrada)', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    // Con cobertura para 02800 NO debe aparecer el mensaje de no-disponible…
    await expect(page.getByText(/No disponible para C\.P\./i)).toHaveCount(0);
    // …y el CTA "Agregar a carrito" (`button.buy`) debe quedar HABILITADO.
    await expect(page.locator('button.buy').first()).toBeEnabled({ timeout: 15000 });
  });
});
