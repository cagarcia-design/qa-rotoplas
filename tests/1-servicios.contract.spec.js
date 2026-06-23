// tests/1-servicios.contract.spec.js
// CAPA 1 · CONTRACT — Landing de servicios /servicios/.
// Verifica que la página de servicios por contratación renderice con sus
// secciones y CTAs. Es la puerta de entrada a servicios-lavado y otros.
//
// Tag: @contract

const { test, expect, irA } = require('./_helpers');

test.describe('@contract Servicios — /servicios/', () => {

  test('Página de servicios renderiza', async ({ page }) => {
    await irA(page, '/servicios/');
    // BUG-353: sin H1. El H2 "Servicios" actúa como heading principal.
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText.length).toBeGreaterThan(3);
  });

  test('Secciones de servicio visibles', async ({ page }) => {
    await irA(page, '/servicios/');
    // La página tiene CTAs tipo "Quiero saber más", "Cotizar lavado", etc.
    const ctas = page.locator('a, button').filter({ hasText: /saber más|cotizar|servicio|contratar/i });
    const count = await ctas.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

});
