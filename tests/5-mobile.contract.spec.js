// tests/5-mobile.contract.spec.js
// CAPA 1 · CONTRACT — Viewport MÓVIL (375px). La mayoría de usuarios B2C entran por
// celular y el Cut 1 excluyó móvil a propósito → este spec cierra ese hueco.
//
// QUÉ ASERTA (invariantes que HOY se cumplen en móvil — no bugs conocidos):
//   1. Sin overflow horizontal (scrollWidth ≤ clientWidth) en home, PDP y catálogo.
//   2. La hamburguesa existe y ABRE el menú móvil (la nav es alcanzable en celular).
//   3. PDP y catálogo renderizan su plantilla en 375px.
//
// NO asercióna BUG-528 (nav institucional ausente del menú móvil) ni BUG-504 (sin sticky
// CTA) — son bugs conocidos; exigirlos sería rojo desde el día 1 (baseline ejecutable).
//
// Selectores móviles del inventario (Parte I, header tree): hamburguesa
// `label[for="open-menu"]` (.tool.menu), contenedor `.mobile-menu`. Verificado vs DOM.
//
// Viewport: iPhone SE (375×667, isMobile) vía test.use → corre dentro del project
// b2c-contracts pero con contexto móvil solo para este spec.
//
// Tag: @contract @mobile
// Correr: npm run check:b2c:contracts  (o npm run check:b2c)

const { test, expect, irA, seedCobertura } = require('./_helpers');
const { devices } = require('@playwright/test');
const { PRODUCTO, COBERTURA_SEED } = require('./_targets');
const { HEALTH_URLS } = require('./_targets');

test.use({ ...devices['iPhone SE'] }); // 375×667, isMobile, hasTouch

const CATEGORIA = HEALTH_URLS.find((u) => /\/products\//.test(u.url));

/** ¿La página NO desborda horizontalmente? (tolerancia 2px por redondeo). */
async function sinOverflowX(page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollWidth <= d.clientWidth + 2;
  });
}

test.describe('@contract @mobile Móvil 375px — layout y navegación', () => {
  // ⏸️ PENDIENTE (s26) — aparcado tras diagnóstico en vivo. Ajustes ANTES de activar:
  //   1. Overflow: el check `scrollWidth <= clientWidth` da FALSO POSITIVO por un drawer
  //      off-canvas (`.drawer-panel.header-extension`, right:646). El body tiene
  //      overflow-x:hidden → no hay scroll real. Fix: medir overflow REAL con intento de
  //      scroll → `window.scrollTo(200,0); window.scrollX === 0` (no scrollWidth).
  //   2. Hamburguesa: `label[for="open-menu"]` EXISTE pero reporta width 0 (el icono
  //      visible es el `<span><svg>` interno) → toBeVisible falla. Fix: toBeAttached, o
  //      anclar al svg/span interno.
  //   3. iPhone SE = 320px de ancho (no 375). Si se quiere 375, viewport explícito.
  test.skip(true, 'WIP móvil — ver findings arriba (s26). Reactivar tras ajustar checks.');


  test('Home: header + hamburguesa visibles, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/');
    await expect(page.locator('header').first()).toBeVisible();
    // Hamburguesa móvil (label que togglea #open-menu). Ancla del inventario I.1.
    await expect(page.locator('label[for="open-menu"]').first()).toBeVisible();
    expect(await sinOverflowX(page), 'home desborda horizontalmente en 375px').toBeTruthy();
  });

  test('Hamburguesa abre el menú móvil (nav alcanzable en celular)', async ({ page }) => {
    await irA(page, '/');
    const hamburguesa = page.locator('label[for="open-menu"]').first();
    await hamburguesa.click(); // click real (CDP) — Qwik checkbox toggle
    // El menú móvil pasa a visible. Invariante load-bearing: la nav existe en móvil.
    await expect(page.locator('.mobile-menu').first()).toBeVisible({ timeout: 8000 });
  });

  test('PDP en 375px: H1 + botón comprar, sin overflow horizontal', async ({ page }) => {
    await seedCobertura(page, COBERTURA_SEED);
    await irA(page, PRODUCTO.slug);
    await expect(page.getByRole('heading', { level: 1, name: PRODUCTO.nombre })).toBeVisible();
    await expect(page.locator('button.buy').first()).toBeVisible();
    expect(await sinOverflowX(page), 'PDP desborda horizontalmente en 375px').toBeTruthy();
  });

  test('Catálogo en 375px: lista productos, sin overflow horizontal', async ({ page }) => {
    await irA(page, CATEGORIA.url);
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(800);
    await expect
      .poll(async () => page.locator('article[class*="card-product-filter"]').count(), { timeout: 12000 })
      .toBeGreaterThan(0);
    expect(await sinOverflowX(page), 'catálogo desborda horizontalmente en 375px').toBeTruthy();
  });
});
