// tests/1-content.contract.spec.js
// CAPA 1 · CONTENT — Contenido mínimo por URL crítica.
//
// POR QUÉ ESTA CAPA EXISTE (decisión del usuario s21):
// Health (Capa 0) solo pregunta "¿la URL responde 200?". Pero un 200 NO garantiza que
// la página renderizó: el sitio es Qwik (CSR) y puede devolver 200 con un cascarón en
// blanco si la hidratación falla, si un loader revienta, o si el HTML llega sin <title>.
// "200 ≠ funcional" ya nos mordió en vivo (s19: Health 200 en todo, pero un elemento
// crítico de la PDP no renderizó). Esta capa cierra ese hueco SIN engordar Health:
// por cada URL de HEALTH_URLS verifica UNA ancla estable de que hubo contenido real.
//
// QUÉ ASERTA (lo más barato que distingue "página real" de "cascarón vacío/error"):
//   1. <title> NO vacío → el documento resolvió (no es un shell en blanco ni un error).
//   2. <header> visible → el layout global montó (la hidratación Qwik corrió).
// NO asercióna H1 — el sitio NO tiene H1 sistémicamente (BUG-B2C-353/001), así que
// exigirlo sería rojo desde el día 1 por un bug viejo (ver ADR "baseline ejecutable").
//
// Es data-driven sobre HEALTH_URLS (la misma fuente única que Capa 0) → cuando se
// agregue/quite una URL allí, esta capa la cubre sola, sin tocar este archivo.
//
// Correr: npm run check:b2c:content   (o npm run check:b2c para todo)

const { test, expect, irA } = require('./_helpers');
const { HEALTH_URLS } = require('./_targets');

test.describe('@content Contenido mínimo por URL', () => {

  for (const { nombre, url } of HEALTH_URLS) {
    test(`${nombre} — renderiza contenido real (title + header), no solo 200`, async ({ page }) => {
      await irA(page, url);

      // 1) El documento tiene <title> no vacío. expect.poll reintenta mientras Qwik
      //    hidrata el head (el title puede setearse en cliente). Invariante: que EXISTA
      //    contenido, no que sea correcto (algunos titles son el slug crudo, BUG-428).
      await expect
        .poll(async () => (await page.title()).trim().length, { timeout: 10000 })
        .toBeGreaterThan(0);

      // 2) El cascarón global montó: <header> visible. Es el landmark presente en TODA
      //    página del sitio (1-global-layout lo confirma) → su ausencia = render roto.
      await expect(page.locator('header').first()).toBeVisible();
    });
  }
});
