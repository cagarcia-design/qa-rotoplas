// tests/9-flujo-areas.contract.spec.js
// FLUJOS DE ÁREA (lectura, no mutan) — llenan las celdas "Flujo" del mapa que estaban ⏳:
//   Header (buscador) · Home (selector de soluciones) · Institucional (faq · contacto · distribuidores).
//
// Tags POR ÁREA, deliberadamente SIN el substring "@flujo" para que el panel pueda correr
// cada celda por separado (Playwright --grep es regex de subcadena: "@flujo" haría match con
// "@flujo-header" y mezclaría áreas). El paraguas de "es un flujo" lo da el nombre del describe.
//   @flheader · @flhome · @flinst   (+ @contract → entran en la suite de contracts)
//
// Selectores verificados contra el inventario + diagnóstico en vivo 2026-06-23 (s28).
// Regla de selectores: roles/texto/href; nunca clases hash de Qwik.

const { test, expect, irA, scrollAlFondo } = require('./_helpers');

// ─────────────────────────────────────────────────────────────────────────────
// HEADER — Buscador (input#search-input, duplicado 2× en DOM por BUG-B2C-016 → .first()).
// Enter navega al SRP /products/?search=<término> (verificado en vivo). El SRP lista PDPs.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('@flheader @contract Header — buscador', () => {
  test('Buscar un término navega al SRP con resultados', async ({ page }) => {
    await irA(page, '/');
    const input = page.locator('input#search-input').first();
    await expect(input).toBeVisible();
    await input.click();
    await input.fill('tinaco');
    await input.press('Enter');
    await page.waitForURL(/\/products\/\?search=tinaco/i, { timeout: 10000 });
    expect(page.url(), 'la búsqueda debe llevar al SRP con el query').toMatch(/search=tinaco/i);
    // El SRP renderiza cards de producto del catálogo (la card navega por handler Qwik, sin <a>).
    await expect
      .poll(async () => page.locator('article[class*="card-product-filter"]').count(), { timeout: 12000 })
      .toBeGreaterThan(0);
    // Y los resultados son RELEVANTES al término: ≥1 card menciona "tinaco" (las cards montan
    // por scroll — render perezoso Qwik → forzar scroll y contar, no exigir viewport).
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(800);
    await expect
      .poll(async () => page.locator('article[class*="card-product-filter"]').filter({ hasText: /tinaco/i }).count(), { timeout: 12000 })
      .toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HOME — Selector "¿Qué necesitas solucionar hoy?" (4 radios name="solution" + botón
// "Soluciones"). Verificado en vivo (chrome-devtools, s28): el botón arranca DISABLED;
// elegir una solución lo HABILITA y al enviar NAVEGA a la categoría que la resuelve
// ("Baja presión de agua" → /products/presurizacion/). El radio nativo está estilizado/oculto
// (no interactivo) → el control clickeable es su LABEL de texto. La navegación tarda ~1-3 s.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('@flhome @contract Home — selector de soluciones', () => {
  test('Elegir una solución y enviar navega a su categoría', async ({ page }) => {
    await irA(page, '/');
    const btn = page.getByRole('button', { name: 'Soluciones', exact: true });
    await btn.scrollIntoViewIfNeeded();
    await expect(btn, 'el botón debe arrancar deshabilitado').toBeDisabled();
    // El radio nativo está estilizado/oculto; el control clickeable es su label de texto.
    await page.getByText('Baja presión de agua en mi casa.', { exact: true }).click();
    await expect(btn, 'elegir una solución debe habilitar el botón').toBeEnabled();
    await btn.click();
    // "Baja presión" la resuelve la categoría de presurización (bombas) → navega allí.
    await page.waitForURL(/\/products\/presurizacion\//i, { timeout: 15000 });
    expect(page.url(), 'debe navegar a la categoría que resuelve la solución').toMatch(/presurizacion/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INSTITUCIONAL — Contacto (/contacto/): el form (campos FUERA de <form>: name·phone·
// email·zipcode·type·message·privacity + botón "Enviar") VALIDA antes de enviar.
// Flujo SEGURO (no muta): submit VACÍO → aparece "Este es un campo requerido" y NO se
// envía (sigue en /contacto/). Verificado en vivo (chrome-devtools, s28).
// Residual de área (no en este spec): FAQ acordeón (BUG-091, mecanismo dudoso) ·
// distribuidores encadenado (selects + Google Maps, frágil).
// ─────────────────────────────────────────────────────────────────────────────
test.describe('@flinst @contract Institucional — contacto', () => {
  test('Enviar el form vacío dispara validación y NO envía', async ({ page }) => {
    await irA(page, '/contacto/');
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    // Validación visible (≥1 campo requerido) y sin envío (no navega fuera de /contacto/).
    await expect(page.getByText('Este es un campo requerido').first()).toBeVisible();
    expect(page.url(), 'no debe enviarse: sigue en /contacto/').toMatch(/\/contacto\//);
  });
});
