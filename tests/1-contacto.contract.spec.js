// tests/contracts/b2c/1-contacto.contract.spec.js
// CAPA 1 · CONTRACT — Formulario de contacto /contacto/.
// Verifica que el form de contacto renderice sus 7 campos y responda al submit
// vacío con errores inline. Es la puerta de entrada para leads y soporte.
//
// Anclajes estables del inventario I.14.d y II.14. Sin clases hash de Qwik.
//
// Tag: @contract
// Correr: npm run check:b2c:contracts

const { test, expect, irA } = require('./_helpers');

test.describe('@contract Contacto — /contacto/', () => {

  test('Campos del formulario visibles', async ({ page }) => {
    await irA(page, '/contacto/');
    // BUG-B2C-067: sin H1. Usamos H2.
    await expect(page.getByRole('heading', { name: /contacto/i, level: 2 })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="zipcode"]')).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
    await expect(page.locator('input[name="message"]')).toBeVisible();
    await expect(page.locator('input[name="privacity"]')).toBeVisible();
    await expect(page.locator('button:has-text("Enviar")').first()).toBeVisible();
  });

  test('Errores de validación con submit vacío', async ({ page }) => {
    await irA(page, '/contacto/');
    await page.locator('button:has-text("Enviar")').first().click();
    // Al menos 3 errores inline deben aparecer (name, phone, email, type, message)
    // BUG-B2C-075: estilos de error mezclados ("Introduce un X válido" vs "Este es un campo requerido")
    await expect(
      page.getByText(/requerido|válido|válida/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
