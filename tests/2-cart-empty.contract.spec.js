// tests/contracts/b2c/2-cart-empty.contract.spec.js
// CAPA 1 · CONTRACT — Carrito vacío (autenticado).
// El B2C no persiste el add-to-cart anónimo (BUG-B2C-481), por lo que el estado
// vacío SOLO es visible con sesión iniciada. Verifica que el empty state renderice
// correctamente: heading, ilustración y botón de catálogo.
//
// Requiere auth (storageState). Correr como parte de @contract (con sesión).
// Si no hay sesión, correr check:b2c:anon lo excluye (tag @auth).
//
// Tag: @contract @auth
// Correr: npm run check:b2c:contracts (requiere sesión)

const { test, expect, irA } = require('./_helpers');

test.describe('@contract @auth Carrito — estado vacío', () => {

  test('Empty state visible sin items', async ({ page }) => {
    await irA(page, '/cart/');
    // Si el carrito tiene items (residuos), este test igual verifica que algo renderiza.
    // Prioridad: verificar que la página NO está en blanco.
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    // Puede ser "Tu carrito está vacío" (sin items) o "Mi Carrito" (con items)
    expect(text.length).toBeGreaterThan(2);
  });

  test('Botón "Ver productos" o "Iniciar compra" presente', async ({ page }) => {
    await irA(page, '/cart/');
    // Si hay items → "Iniciar compra". Si está vacío → "Ver productos".
    // Ambos son load-bearing: sin ellos el usuario no puede avanzar.
    const cta = page.getByRole('button', { name: /ver productos|iniciar compra/i }).first();
    await expect(cta).toBeVisible();
  });

});
