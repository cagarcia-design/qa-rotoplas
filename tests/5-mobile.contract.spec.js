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
// Selectores móviles del inventario (I.2, línea 138 + evidencia F4-01): la hamburguesa
// mobile es `button[aria-label="Abrir menú"]` (visible <768px). OJO: el viejo
// `label[for="open-menu"]` es un artefacto 0x0 NO clickeable (mega-menú desktop) y
// `.mobile-menu` es solo el WRAPPER del botón — el menú real que se monta al abrir es
// `.mobile-menu-content` (ausente antes del click, visible después). Verificado en vivo 375px.
//
// Viewport: iPhone SE (375×667, isMobile) vía test.use → corre dentro del project
// b2c-contracts pero con contexto móvil solo para este spec.
//
// Tag: @contract @mobile
// Correr: npm run check:b2c:contracts  (o npm run check:b2c)

const path = require('path');
const fs = require('fs');
const { test, expect, irA, seedCobertura } = require('./_helpers');
const { PRODUCTO, COBERTURA_SEED } = require('./_targets');
const { HEALTH_URLS } = require('./_targets');

// Sesión B2C para el Móvil de "Mi cuenta" (/customer redirige a /login sin sesión).
const AUTH_FILE = path.resolve(__dirname, '../rotoplas-auth-b2c.json');
const HAY_SESION = fs.existsSync(AUTH_FILE);

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

  // ✅ Desparqueados (s28): la causa del parqueo era el selector equivocado. El antiguo
  // `label[for="open-menu"]` es un artefacto 0x0 no clickeable; el trigger real es
  // `button[aria-label="Abrir menú"]` (inventario I.2/F4-01). Al hacer click (CDP real de
  // Playwright) se monta `.mobile-menu-content` — ese es el invariante de apertura.
  test('Home: header + hamburguesa presentes, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/');
    await expect(page.locator('header').first()).toBeVisible();
    // Hamburguesa mobile real: button con aria-label "Abrir menú" (visible <768px).
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
    expect(await sinOverflowX(page), 'home desborda horizontalmente en 375px').toBeTruthy();
  });

  test('Hamburguesa abre el menú móvil (nav alcanzable en celular)', async ({ page }) => {
    await irA(page, '/');
    // Click CDP real en el botón real (Qwik on:click responde al click de Playwright). El
    // menú "Menú principal" se monta al abrir: `.mobile-menu-content` (ausente antes del
    // click) pasa a visible. Invariante load-bearing: la nav es alcanzable en celular.
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.locator('.mobile-menu-content')).toBeVisible({ timeout: 8000 });
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

  // ── Resto de la columna Móvil (s28): cada área en 375px renderiza su shell sin overflow.
  //    Verificado en vivo (chrome-devtools, viewport 375). Títulos con sufijo único por área
  //    para que el panel los recorte por `--grep` (AREAS[area].movil) sin colisión.

  test('Cascarón en 375px: footer global presente, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/');
    await expect(page.locator('footer').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Servicio al cliente' })).toBeVisible();
    expect(await sinOverflowX(page), 'el cascarón desborda en 375px').toBeTruthy();
  });

  test('Servicios en 375px: landing renderiza, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/servicios-lavado/');
    await expect(page.locator('footer').first()).toBeVisible();
    expect(await sinOverflowX(page), 'Servicios desborda en 375px').toBeTruthy();
  });

  test('Institucional en 375px: contacto renderiza, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/contacto/');
    // El botón "Enviar" del form de contacto es estable y específico de la página (el heading
    // "Contacto" es lazy en móvil) + footer global + sin overflow.
    await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeVisible();
    expect(await sinOverflowX(page), 'Institucional desborda en 375px').toBeTruthy();
  });

  test('Compra en 375px: carrito renderiza, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/cart/');
    await expect(page.getByRole('heading', { name: /mi carrito/i }).first()).toBeVisible();
    expect(await sinOverflowX(page), 'Compra (carrito) desborda en 375px').toBeTruthy();
  });
});

// Mi cuenta (/customer) a 375px requiere sesión B2C (anónimo redirige a /login). @auth →
// skip limpio sin sesión, como 2-customer. Mantiene el viewport móvil del test.use de arriba.
test.describe('@contract @mobile @auth Mi cuenta 375px', () => {
  test.skip(!HAY_SESION, 'Sin sesión B2C (rotoplas-auth-b2c.json). Corre `npm run auth:b2c`. No es regresión.');
  if (HAY_SESION) test.use({ storageState: AUTH_FILE });

  test('Mi cuenta en 375px: customer renderiza, sin overflow horizontal', async ({ page }) => {
    await irA(page, '/customer');
    if (await page.getByText(/inicia sesión/i).first().isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'sesión expirada — no es regresión del sitio');
    }
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    expect((await body.textContent()).length, 'el área de cuenta debe tener contenido').toBeGreaterThan(80);
    expect(await sinOverflowX(page), 'Mi cuenta desborda en 375px').toBeTruthy();
  });
});
