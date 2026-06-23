// tests/0-links.contract.spec.js
// CAPA 0 · HEALTH — Link-check del cascarón (header + footer).
// Extrae TODOS los <a href> del header y footer y verifica que los INTERNOS
// respondan 200. Automatiza la tarea recurrente de "revisar el footer" — atrapa
// el link roto clásico (404/500) que un contract de presencia NO ve.
//
// Diseño: los externos (corporativo, redes, PDFs, b2b) se reportan aparte SIN
// reprobar el run (third-parties bloquean bots / caen sin que sea culpa del B2C).
// El test reprueba solo si un link INTERNO está roto.
//
// Correr: npm run check:b2c:health

const { test, expect, irA, statusDe, scrollAlFondo } = require('./_helpers');

test.describe('@health Link-check del cascarón (header + footer)', () => {

  test('Todos los links INTERNOS de header y footer responden 200', async ({ page, request }) => {
    await irA(page, '/');
    await scrollAlFondo(page); // forzar render perezoso del footer

    const hrefs = await page.evaluate(() => {
      const set = new Set();
      for (const sel of ['header a[href]', 'footer a[href]']) {
        for (const a of document.querySelectorAll(sel)) {
          const h = a.getAttribute('href');
          if (h && !h.startsWith('#') && !h.startsWith('javascript:') && !h.startsWith('tel:') && !h.startsWith('mailto:')) {
            set.add(h);
          }
        }
      }
      return [...set];
    });

    const base = new URL(page.url());
    const internos = [];
    const externos = [];
    for (const h of hrefs) {
      try {
        const u = new URL(h, base);
        if (!u.protocol.startsWith('http')) continue;
        (u.origin === base.origin ? internos : externos).push(u.toString());
      } catch { /* href inválido → ignorar */ }
    }

    const roto = [];
    for (const url of internos) {
      const s = await statusDe(request, url);
      if (s !== 200) roto.push(`${url} → ${s}`);
    }

    // Diagnóstico visible en el log del run (no reprueba por externos).
    console.log(`[link-check] internos: ${internos.length} | externos (no verificados): ${externos.length}`);
    if (externos.length) console.log(`[link-check] externos:\n  ${externos.join('\n  ')}`);

    expect(roto, `Links INTERNOS rotos en header/footer:\n  ${roto.join('\n  ')}`).toEqual([]);
  });
});
