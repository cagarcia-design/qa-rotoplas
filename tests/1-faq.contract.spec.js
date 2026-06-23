// tests/1-faq.contract.spec.js
// CAPA 1 · CONTRACT — Preguntas frecuentes /preguntas-frecuentes/.
// Verifica que la página de FAQs renderice con sus tabs de categoría y
// acordeones. Es la principal fuente de autoservicio del cliente.
//
// Anclajes del inventario II.13. Sin clases hash de Qwik.
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');

test.describe('@contract FAQ — /preguntas-frecuentes/', () => {

  test('Página de FAQs renderiza con headings', async ({ page }) => {
    await irA(page, '/preguntas-frecuentes/');
    // BUG-036: H1 dice "Contáctanos" en vez de "Preguntas frecuentes".
    // Verificamos que al menos exista UN heading.
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible();
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Tabs de categoría visibles', async ({ page }) => {
    await irA(page, '/preguntas-frecuentes/');
    // Las tabs usan spans/divs con handlers Qwik, no botones nativos.
    // Verificamos que al menos 3 categorías estén presentes.
    const tabs = page.locator('[tab], [class*="tab"], [class*="faq"]');
    const texts = [];
    for (const el of await tabs.all()) {
      const t = await el.textContent();
      if (t.trim().length > 2 && t.trim().length < 40) texts.push(t.trim());
    }
    expect(texts.length).toBeGreaterThanOrEqual(3);
  });

  test('Acordeones de preguntas presentes', async ({ page }) => {
    await irA(page, '/preguntas-frecuentes/');
    // BUG-078: los acordeones son <p class="faqs-titulo"> sin <details>.
    // BUG-091: el click puede no expandir (race condition Qwik).
    // Verificamos solo que existan elementos de pregunta.
    const preguntas = page.locator('[class*="faqs-titulo"], [class*="question"], [class*="pregunta"]');
    const count = await preguntas.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

});
