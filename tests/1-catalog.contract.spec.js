// tests/1-catalog.contract.spec.js
// CAPA 1 · CONTRACT — Catálogo: las categorías LISTAN productos y la PDP es alcanzable.
//
// QUÉ AÑADE sobre 1-content (N0): 1-content verifica que la categoría renderice
// (title + header). ESTE spec sube a N1: verifica que la categoría realmente LISTA
// productos (no una rejilla vacía) y que el primer producto NAVEGA a una PDP que
// renderiza su plantilla. Una categoría puede montar su cascarón y traer 0 productos
// (loader roto, índice vacío) → eso es incidente y 1-content no lo atrapa.
//
// ADEMÁS reduce la dependencia del SKU fijo (310002): la PDP se alcanza DINÁMICAMENTE
// desde el catálogo (primer producto real) → si el catálogo renombra/da de baja un SKU,
// este check sigue verde mientras EXISTAN productos (a diferencia del health/content de
// PDP, atados al slug fijo). Ver overview F6 robustez de prod.
//
// ⚠️ DOM REAL (verificado en vivo 2026-06-18): las cards son
//   <article class="card-product-filter"> (84 en /products/almacenamiento/) y NO son
//   <a href>: navegan por un `on:click` de Qwik (un <div>, no un link → problema a11y
//   aparte). Por eso NO se puede anclar a `a[href*="/product/"]` (da 0). Se ancla a la
//   card y se navega con un CLICK REAL sobre su galería.
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');
const { HEALTH_URLS } = require('./_targets');

// Las 7 plantillas de categoría (ya en HEALTH_URLS) → fuente única, sin re-listar URLs.
const CATEGORIAS = HEALTH_URLS.filter((u) => /\/products\//.test(u.url));
const CARD = 'article[class*="card-product-filter"]';

// Nudge ligero para disparar el render perezoso (on:qvisible) de las cards. NO usamos
// scrollAlFondo (espera el footer 15s) — las cards están sobre el fold y montan al entrar
// en viewport; un scroll corto basta y mantiene el check rápido.
async function nudgeRender(page) {
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(800);
}

test.describe('@contract Catálogo — las categorías listan productos', () => {

  for (const { nombre, url } of CATEGORIAS) {
    test(`${nombre} — lista al menos un producto`, async ({ page }) => {
      await irA(page, url);
      await nudgeRender(page);
      // Invariante N1: la categoría trae cards de producto. Poll por hidratación CSR.
      await expect
        .poll(async () => page.locator(CARD).count(), { timeout: 12000 })
        .toBeGreaterThan(0);
    });
  }
});

test.describe('@contract Catálogo — la PDP es alcanzable desde el catálogo (dinámico)', () => {

  test('Primer producto de la 1ª categoría → su PDP renderiza la plantilla', async ({ page }) => {
    await irA(page, CATEGORIAS[0].url);
    await nudgeRender(page);

    const card = page.locator(CARD).first();
    await expect(card).toBeVisible({ timeout: 12000 });

    // La card NO es un <a> (navega por on:click Qwik) → click REAL sobre su galería.
    const urlAntes = page.url();
    await card.locator('.galery').first().click();
    // Navegó a la PDP (sin asumir el formato exacto: /product/SLUG/ o /pdp?…).
    await page.waitForFunction((u) => location.href !== u, urlAntes, { timeout: 20000 });
    await page.waitForTimeout(2000);

    // Plantilla de PDP (sin sembrar cobertura → no aserción de precio/habilitado): basta
    // que el ESQUELETO renderice. Anclas estables: H1 con texto + CTA de compra en el DOM.
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button.buy').first()).toBeAttached({ timeout: 10000 });
    // Y aterrizó en una PDP real (no rebotó a /producto-no-disponible/).
    expect(page.url()).toMatch(/\/product\/|\/pdp/);
    expect(page.url()).not.toContain('/producto-no-disponible');
  });
});
