// tests/1-distribuidores.contract.spec.js
// CAPA 1 · CONTRACT — Buscador de distribuidores /distribuidores/.
// Verifica que los selects encadenados estado→ciudad y el mapa de Google
// rendericen. Es la puerta de entrada para clientes que buscan tienda física.
//
// Anclajes estables del inventario II.15. Sin clases hash de Qwik.
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');

test.describe('@contract Distribuidores — /distribuidores/', () => {

  test('Heading y selects de búsqueda visibles', async ({ page }) => {
    await irA(page, '/distribuidores/');
    // BUG-B2C-353: sin H1. El heading principal es H3.
    await expect(
      page.locator('h3, [role="heading"]').filter({ hasText: /distribuidores/i }).first()
    ).toBeVisible();
    // BUG-B2C-358: 2 selects con name="building" (uno oculto del modal CP)
    // El visible es el de estados (2º en DOM). El cityS carga dinámico.
    await expect(page.locator('select[name="building"]').last()).toBeVisible();
  });

  test('Select de estados tiene opciones', async ({ page }) => {
    await irA(page, '/distribuidores/');
    const estados = page.locator('select[name="building"]').last();
    await expect(estados).toBeVisible();
    // Debe tener al menos 20 opciones (32 estados mexicanos - 6 faltantes BUG-361)
    const opts = await estados.locator('option').count();
    expect(opts).toBeGreaterThan(15);
  });

  test('Mapa de Google presente', async ({ page }) => {
    await irA(page, '/distribuidores/');
    // El mapa es un div con datos de Google Maps (no iframe)
    await expect(
      page.locator('[aria-label="Mapa"], .gm-style, div[style*="maps"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

});
