// tests/contracts/b2c/1-legales.contract.spec.js
// CAPA 1 · CONTRACT — Páginas legales.
// Verifica que aviso de privacidad y seguridad de la información rendericen
// contenido. Términos y condiciones redirige cross-domain (BUG-037) → no se
// contractea, solo se verifica el redirect vía 0-links.
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');

test.describe('@contract Legales', () => {

  test('/aviso-de-privacidad — renderiza contenido', async ({ page }) => {
    await irA(page, '/aviso-de-privacidad/');
    // BUG-353: sin H1. Verificamos que la página tenga contenido sustancial.
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text.length).toBeGreaterThan(200);
    expect(text).toMatch(/privacidad|datos personales/i);
  });

  test('/seguridad-de-la-informacion — renderiza contenido', async ({ page }) => {
    await irA(page, '/seguridad-de-la-informacion/');
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    const text = await body.textContent();
    // BUG-428: title es el slug crudo, pero el body SÍ tiene contenido real
    expect(text.length).toBeGreaterThan(200);
    expect(text).toMatch(/seguridad|información/i);
  });

});
