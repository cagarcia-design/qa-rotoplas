// tests/_helpers.js
// Helpers compartidos por los checks post-liberación del B2C (qarotoplasmx.io).
//
// QUÉ SON ESTOS CHECKS: pruebas de humo estructurales post-deploy. Detectan
// REGRESIONES (un elemento crítico que desaparece, un href que cambia, una
// sección que deja de renderizar). NO validan precios, stock, fechas ni pixeles.
// Ver el ADR completo en: tickets/regresiones-smoke-b2c/overview.md (sección F6).
//
// QUIRKS DEL SITIO (de .claude/rules/tests.md y el inventario):
//  - QuantumMetrics hace polling permanente → la red NUNCA queda "networkidle".
//    JAMÁS usar waitForLoadState('networkidle'): cuelga hasta timeout. Usar irA().
//  - Es un sitio Qwik (Builder.io): las clases son hashes que cambian en cada
//    build (.⭐️7y6rwi-1, q-*.js). PROHIBIDO asertar contra ellas — usar roles,
//    texto accesible y hrefs de producto. Ver SELECTOR_STABILITY abajo.

const { test, expect } = require('@playwright/test');

/**
 * SELECTOR_STABILITY — la regla de oro de esta suite.
 * Jerarquía de selectores, de más estable a más frágil:
 *   1. getByRole('button'|'link'|'heading', { name }) ........ DEFAULT
 *   2. texto visible / href de producto (page.getByText, [href])
 *   3. data-testid (si el dev lo agregó)
 *   4. ❌ clases hash de Qwik, IDs generados, q-*.js ......... PROHIBIDO
 * Un selector del nivel 4 produce falsos rojos en el próximo deploy.
 */

/**
 * Navega de forma robusta para este sitio (sin networkidle).
 * @param {import('@playwright/test').Page} page
 * @param {string} path    ruta relativa, ej. '/cart/'  (usa baseURL del proyecto)
 * @param {number} settle  ms tras DOMContentLoaded para la hidratación CSR de Qwik
 */
async function irA(page, path, settle = 2500) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(settle);
}

/**
 * Verifica que una URL responde sano (Capa 0 · Health), sin renderizar la página.
 * Reintenta en códigos TRANSITORIOS (429/502/503/504) con backoff — son hiccups
 * de infra / rate-limiting (a menudo auto-inflingidos por la propia ráfaga de
 * checks), NO links rotos. Un roto real da 404/410/500 consistente → no reintenta.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} url       URL absoluta
 * @param {number} intentos  número máximo de intentos (default 3)
 * @returns {Promise<number>} último status HTTP observado
 */
async function statusDe(request, url, intentos = 3) {
  const TRANSITORIOS = new Set([429, 502, 503, 504]);
  let status = 0;
  for (let i = 0; i < intentos; i++) {
    const res = await request.get(url, { failOnStatusCode: false, maxRedirects: 5 });
    status = res.status();
    if (!TRANSITORIOS.has(status)) return status;
    await new Promise((r) => setTimeout(r, 600 * (i + 1))); // backoff lineal
  }
  return status;
}

/**
 * BASELINE EJECUTABLE — envuelve un test que documenta un BUG CONOCIDO.
 * Marca el test como "se espera que falle". Si el bug se ARREGLA, Playwright
 * reporta el test como "unexpected pass" → señal de que hay que cerrar el bug.
 * Si el bug EMPEORA de otra forma, el assert distinto lo delata.
 *
 * Uso:
 *   bugConocido(test, 'BUG-B2C-353', 'PDP sin H1 — debería tener uno', async ({ page }) => {
 *     await irA(page, '/product/...');
 *     await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // hoy falla
 *   });
 *
 * @param {import('@playwright/test').TestType} t  el objeto `test` de Playwright
 * @param {string} bugId   ej. 'BUG-B2C-353'
 * @param {string} titulo  descripción del invariante que HOY no se cumple
 * @param {Function} fn    cuerpo del test
 */
function bugConocido(t, bugId, titulo, fn) {
  // Playwright analiza estáticamente la firma → el primer arg DEBE destructurar.
  // Reenviamos { page } (los known-bug tests solo necesitan la página).
  t(`[${bugId}] ${titulo}`, async ({ page }) => {
    t.fail(`Bug conocido ${bugId}: si este test PASA, el bug se arregló → cerrarlo.`);
    await fn({ page });
  });
}

/**
 * Hace scroll al fondo para forzar el render perezoso de Qwik (footer y secciones
 * profundas montan tarde / al entrar en viewport). Llamar antes de asertar
 * contenido del fondo de la página. Ver hallazgo de flakiness en overview F6.
 * @param {import('@playwright/test').Page} page
 */
async function scrollAlFondo(page, settle = 800) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // Esperar a que el footer realmente monte (lazy-render Qwik, más lento bajo
  // carga paralela) en vez de un timeout ciego → robusto contra flakiness.
  await page.locator('footer').waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(settle);
}

/**
 * Siembra la cobertura por CP en localStorage ANTES de cargar la página, para
 * que la PDP sea determinista (disponible, con precio, compra habilitada) sin
 * tener que caminar el modal de CP en cada corrida. Ver hallazgo F6 #1 en el
 * overview. Llamar ANTES de irA().
 *
 *   await seedCobertura(page);
 *   await irA(page, PRODUCTO.slug);
 *
 * @param {import('@playwright/test').Page} page
 * @param {Record<string,string>} seed  pares clave→valor (de _targets COBERTURA_SEED)
 */
async function seedCobertura(page, seed) {
  await page.addInitScript((data) => {
    for (const [k, v] of Object.entries(data)) {
      try { localStorage.setItem(k, v); } catch (_) { /* contexto sin storage */ }
    }
  }, seed);
}

module.exports = { test, expect, irA, statusDe, bugConocido, seedCobertura, scrollAlFondo };
