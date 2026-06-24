// tests/1-contenido.contract.spec.js
// CAPA 1 · CONTRACT — Páginas de contenido editorial/corporativo del área
// Institucional / Contenido: Nosotros, Blog, Recursos.
//
// POR QUÉ ESTE CONTRACT EXISTE (auditoría de taxonomía 2026-06-24):
// El sitio B2C sirve /nosotros/, /blog/ y /recursos/ como páginas reales,
// indexables (robots: index,follow) y con canonical propio en qarotoplasmx.io
// — NO son links al sitio corporativo. La taxonomía por área no tenía casilla
// para ellas (hueco MECE) → se adoptan en Institucional / Contenido.
//
// QUÉ ASERTA (lo más barato que distingue "página real" de "cascarón de error"):
//   1. Render real: el <body> tiene contenido sustancial (>200 chars).
//   2. NO es la página de error genérica (BUG-B2C-034: varias rutas devuelven 200
//      con H1 "Ha ocurrido un error"). Esta es la aserción load-bearing — separa
//      "responde 200" de "renderizó la página correcta".
//   3. El cascarón global montó (<header> visible).
//   4. Un ancla de tema por página (evita que un 200 con la página equivocada pase).
// NO asercióna H1 — estas páginas lo tienen mal/ausente sistémicamente
// (BUG-B2C-220/353), así que exigirlo sería rojo por un bug viejo, no regresión.
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');

// Cada página de contenido + el ancla de tema que prueba que es LA página correcta
// (no el error genérico ni otra ruta). El ancla es laxa a propósito: contenido
// editorial cambia, pero el tema no.
const PAGINAS = [
  { slug: '/nosotros/', nombre: 'Nosotros', tema: /nosotros|rotoplas|agua|soluciones/i },
  { slug: '/blog/',     nombre: 'Blog',     tema: /blog|art[íi]culo|rotoplas|agua/i },
  { slug: '/recursos/', nombre: 'Recursos', tema: /recursos|descarga|conoce|gu[íi]a/i },
];

test.describe('@contract Institucional / Contenido', () => {

  for (const { slug, nombre, tema } of PAGINAS) {
    test(`${nombre} (${slug}) — renderiza contenido real, no la página de error`, async ({ page }) => {
      await irA(page, slug);

      const body = page.locator('main, [role="main"], body').first();
      await expect(body).toBeVisible();
      const text = (await body.textContent()) || '';

      // 1) Contenido sustancial.
      expect(text.length, `${nombre}: el body trae muy poco contenido`).toBeGreaterThan(200);

      // 2) NO es el cascarón de error genérico (BUG-B2C-034). Load-bearing.
      expect(text, `${nombre}: devolvió la página de error genérica (BUG-B2C-034)`)
        .not.toMatch(/Ha ocurrido un error/i);

      // (El header visible lo valida la dimensión Responde —1-content— para estas
      //  mismas URLs; no se duplica aquí para no flakear por el lazy-render de Qwik.)

      // 3) Es LA página correcta (ancla de tema).
      expect(text, `${nombre}: el contenido no parece de la página esperada`).toMatch(tema);
    });
  }
});
