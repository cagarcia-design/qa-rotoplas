// tests/2-seguimiento.contract.spec.js
// CAPA 2 · CONTRACT — Seguimiento de pedido (/traking/), área COMPRA (post-venta).
//
// UBICACIÓN (auditoría de taxonomía 2026-06-24): seguimiento es POST-VENTA del
// pedido y es ANÓNIMO — se entra con el número de pedido, sin sesión. Por eso vive
// en Compra (junto a carrito → checkout → confirmación), NO en Mi cuenta (área con
// auth). Antes estaba mal clasificado bajo cuenta. Su contract salió de 1-forms.
//
// ⚠️ URL canónica: /traking/ (typo fosilizado, BUG-B2C-097). /tracking/ da la
// página de error genérica → NO usar esa.
//
// Anclajes estables del inventario II.12. Sin clases hash de Qwik.
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');

test.describe('@contract Seguimiento de pedido — /traking/', () => {

  test('Formulario de seguimiento visible', async ({ page }) => {
    await irA(page, '/traking/');
    // BUG-B2C-036: H1 dice "Contáctanos" o no existe. Usamos cualquier heading.
    await expect(page.getByRole('heading').first()).toBeVisible();
    // BUG-B2C-094: input con name="password" en vez de orderNumber
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Ver")').first()).toBeVisible();
  });

  test('Error con número de pedido vacío', async ({ page }) => {
    await irA(page, '/traking/');
    await page.getByRole('button', { name: /ver pedido/i }).click();
    // BUG-B2C-098: error dice "incorrecto" aunque el campo está vacío
    await expect(
      page.getByText(/incorrecto|pedido/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
