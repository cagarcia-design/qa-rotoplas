// tests/6-xcut.contract.spec.js
// CALIDAD TRANSVERSAL (@xcut) — chequeos site-wide que NO caben como columna del
// mapa por área (lo harían ilegible). Sección propia del panel: "Errores y enlaces".
//
// QUÉ ASERTA (lo que da señal limpia, no ruido):
//   1. EXCEPCIONES JS NO CAPTURADAS (evento 'pageerror') en páginas clave. Esto es
//      distinto del ruido de console.error (tracking, BUG-050 "error fantasma"): un
//      pageerror es una excepción que reventó sin try/catch → ruptura real de JS que
//      puede dejar la página a medio hidratar. Cero es el invariante sano.
//   2. 404/CATCHALL (BUG-B2C-518): /feed/ responde 200 sirviendo el cascarón (falso-200)
//      en vez de 404. Es un baseline ejecutable: si algún día da 404, el bug se cerró.
//
// NO asercióna "console.error == 0" — el sitio tiene ruido conocido de tracking y el
// error fantasma (BUG-050) → exigir cero sería rojo desde el día 1 por bugs viejos.
//
// Correr: npx playwright test --grep @xcut   (o desde el panel → "Errores y enlaces")

const { test, expect, irA, bugConocido } = require('./_helpers');
const { abs } = require('./_targets');

// Páginas representativas de cada gran zona (no todas — esto es transversal, una muestra).
const PAGINAS = [
  { nombre: 'Home', path: '/' },
  { nombre: 'Categoría', path: '/products/almacenamiento/' },
  { nombre: 'Contacto', path: '/contacto/' },
];

test.describe('@xcut Calidad transversal — errores y enlaces', () => {

  for (const { nombre, path } of PAGINAS) {
    test(`${nombre} — sin excepciones JS no capturadas`, async ({ page }) => {
      const errores = [];
      page.on('pageerror', (e) => errores.push(e.message || String(e)));
      await irA(page, path);
      // Forzar render perezoso (Qwik monta secciones al entrar en viewport) → expone
      // excepciones que solo ocurren al hidratar el fondo de la página.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
      await page.waitForTimeout(900);
      expect(errores, `Excepciones JS no capturadas en ${nombre}:\n` + errores.join('\n')).toEqual([]);
    });
  }

  // BUG-B2C-518 — /feed/ es un falso-200 (sirve el cascarón) en vez de 404. El catchall
  // del sitio responde 200 a rutas inexistentes (verificado en vivo). Baseline: cuando
  // /feed/ devuelva 404 (arreglado), este test pasa inesperadamente → cerrar el bug.
  bugConocido(test, 'BUG-B2C-518', '/feed/ debería responder 404 (hoy 200 catchall)', async ({ page }) => {
    const res = await page.request.get(abs('/feed/'), { failOnStatusCode: false, maxRedirects: 5 });
    expect(res.status(), '/feed/ debería responder 404, no un 200 catchall').toBe(404);
  });
});
