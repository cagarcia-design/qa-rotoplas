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
// desde el catálogo (primer producto real de la categoría) → si el catálogo renombra
// /da de baja un SKU, este check sigue verde mientras EXISTAN productos (a diferencia
// del health/content de PDP, atados al slug fijo). Ver overview F6 robustez de prod.
//
// Selector de producto: a[href*="/product/"] (href de producto = ancla estable de la
// jerarquía SELECTOR_STABILITY). Las cards son <article class="card-product-filter">
// pero el href es más estable que la clase (inventario I.16).
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA, scrollAlFondo } = require('./_helpers');
const { HEALTH_URLS } = require('./_targets');

// Las 7 plantillas de categoría (ya en HEALTH_URLS) → fuente única, sin re-listar URLs.
const CATEGORIAS = HEALTH_URLS.filter((u) => /\/products\//.test(u.url));

test.describe('@contract Catálogo — las categorías listan productos', () => {

  for (const { nombre, url } of CATEGORIAS) {
    test(`${nombre} — lista al menos un producto`, async ({ page }) => {
      await irA(page, url);
      await scrollAlFondo(page); // las cards montan perezoso (Qwik) bajo el fold

      // Invariante N1: la categoría trae productos. Poll por hidratación CSR.
      await expect
        .poll(async () => page.locator('a[href*="/product/"]').count(), { timeout: 12000 })
        .toBeGreaterThan(0);
    });
  }
});

test.describe('@contract Catálogo — la PDP es alcanzable desde el catálogo (dinámico)', () => {

  test('Primer producto de la 1ª categoría → su PDP renderiza la plantilla', async ({ page }) => {
    const primera = CATEGORIAS[0];
    await irA(page, primera.url);
    await scrollAlFondo(page);

    // Tomar el href del PRIMER producto real (sin asumir un SKU). El catálogo puede
    // duplicar nodos desktop/mobile (BUG-005) → tomamos el primer href no vacío único.
    const href = await page.locator('a[href*="/product/"]').first().getAttribute('href');
    expect(href, 'la categoría no expuso ningún link de producto').toBeTruthy();

    await irA(page, href);

    // Plantilla de PDP (sin sembrar cobertura → no aserción de precio/habilitado, que
    // dependen del CP): basta que el ESQUELETO de PDP renderice. Anclas estables:
    //  - un H1 con texto (título de producto) — la PDP sí tiene H1 (a diferencia de la home)
    //  - el CTA de compra existe en el DOM (button.buy, aunque pueda estar disabled sin CP)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button.buy').first()).toBeAttached({ timeout: 10000 });
    // Y la URL es efectivamente una PDP (no rebotó a /producto-no-disponible/).
    expect(page.url()).toContain('/product/');
    expect(page.url()).not.toContain('/producto-no-disponible');
  });
});
