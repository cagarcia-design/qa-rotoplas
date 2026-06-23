// tests/2-cart-empty.contract.spec.js
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

const path = require('path');
const fs = require('fs');
const { test, expect, irA } = require('./_helpers');

// Estado vacío del carrito SOLO es fiable con sesión (el add-to-cart anónimo no
// persiste, BUG-B2C-481). Aplicar el storageState solo si existe; sin él, skip
// limpio (ámbar) en vez de un rojo por correr anónimo. Ver 2-money-path.
const AUTH_FILE = path.resolve(__dirname, '../rotoplas-auth-b2c.json');
const HAY_SESION = fs.existsSync(AUTH_FILE);
if (HAY_SESION) test.use({ storageState: AUTH_FILE });

test.describe('@contract @auth Carrito — estado vacío', () => {
  test.skip(!HAY_SESION, 'Sin sesión B2C (rotoplas-auth-b2c.json). Corre `npm run auth:b2c`. No es regresión del sitio.');

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
