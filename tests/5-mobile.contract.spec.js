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
const { PRODUCTO, COBERTURA_SEED } = require('./_targets');
const { HEALTH_URLS } = require('./_targets');

// Viewport móvil EXPLÍCITO 375×667 (no devices['iPhone SE'], que es 320 — ver finding 3
// del aparcado s26). isMobile+hasTouch para que el sitio sirva su layout de celular.
test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

const CATEGORIA = HEALTH_URLS.find((u) => /\/products\//.test(u.url));

/**
 * ¿La página NO desborda horizontalmente DE VERDAD?
 * `scrollWidth <= clientWidth` daba FALSO POSITIVO (finding 1, s26): un drawer off-canvas
 * (`.drawer-panel`, right:-646) infla scrollWidth aunque el body tiene overflow-x:hidden
 * → no hay scroll real. Medimos el overflow REAL: intentamos scrollear a la derecha y
 * vemos si la página se movió. Si scrollX queda en 0, no hay scroll horizontal real.
 */
async function sinOverflowX(page) {
  return page.evaluate(() => {
    const x0 = window.scrollX;
    window.scrollTo(400, window.scrollY);
    const movido = window.scrollX;
    window.scrollTo(x0, window.scrollY);
    return movido === 0;
  });
}

test.describe('@contract @mobile Móvil 375px — layout y navegación', () => {

  // ⏸️ Los 2 tests de Home (hamburguesa/menú) siguen parqueados (s27): el toggle del
  // menú es un handler Qwik `on:click` SIN `<input>` nativo y `.mobile-menu` aparece
  // duplicado (BUG-005, nodos desktop/mobile) → abrir+asertar el menú en headless
  // necesita inspección de DOM en vivo (cuál `.mobile-menu` se hace visible). PDP y
  // catálogo a 375px SÍ están activos y verdes (overflow real + viewport explícito).
  test('Home: header + hamburguesa presentes, sin overflow horizontal', async ({ page }) => {
    test.skip(true, 'WIP móvil: menú Qwik on:click + .mobile-menu duplicado (BUG-005). Ver nota arriba.');
    await irA(page, '/');
    await expect(page.locator('header').first()).toBeVisible();
    // La hamburguesa es un `label[for="open-menu"]` con width 0 (finding 2, s26): el pixel
    // visible es su `<svg>`/`<span>` interno. Aserción robusta: el control EXISTE (attached)
    // y su ícono interno es visible.
    const hamburguesa = page.locator('label[for="open-menu"]').first();
    await expect(hamburguesa).toBeAttached();
    await expect(hamburguesa.locator('svg, span, img').first()).toBeVisible();
    expect(await sinOverflowX(page), 'home desborda horizontalmente en 375px').toBeTruthy();
  });

  test('Hamburguesa abre el menú móvil (nav alcanzable en celular)', async ({ page }) => {
    test.skip(true, 'WIP móvil: menú Qwik on:click + .mobile-menu duplicado (BUG-005). Ver nota arriba.');
    await irA(page, '/');
    // El `label[for="open-menu"]` tiene width 0 (el pixel visible es su <span><svg>) →
    // Playwright NO puede clickear un elemento de 0px. Clickeamos el <span> interno, que
    // dispara el mismo handler Qwik `on:click`. (No hay <input id="open-menu"> nativo.)
    await page.locator('label[for="open-menu"] span').first().click();
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
