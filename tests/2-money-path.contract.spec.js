// tests/2-money-path.contract.spec.js
// CAPA 1/2 · CONTRACT — Ruta del dinero AUTENTICADA (PDP → carrito → checkout p1).
//
// Por qué autenticado: el add-to-cart anónimo no persiste (BUG-B2C-481) → el
// carrito y el checkout son inalcanzables sin sesión. Este spec carga el
// storageState B2C y siembra cobertura, luego camina el flujo crítico asertando
// el invariante load-bearing de cada paso.
//
// Requisito previo (una vez):  node setup-auth-b2c.js   → rotoplas-auth-b2c.json
// Correr:  npm run check:b2c:contracts
//
// Nota de datos: la cuenta de prueba es compartida; el carrito puede acumular
// items entre corridas → asertamos ">= 1 renglón", no un conteo exacto.

const path = require('path');
const fs = require('fs');
const { test, expect, irA, seedCobertura } = require('./_helpers');
const { PRODUCTO, COBERTURA_SEED } = require('./_targets');

// Sesión autenticada B2C — sobreescribe el storageState anónimo del proyecto.
// SOLO se aplica si el archivo de sesión existe: sin él, Playwright erraría al crear
// el contexto ("Error reading storage state from ...") → un rojo engañoso. Sin sesión,
// los tests hacen skip limpio (ámbar "omitido"), que es lo correcto: no es regresión.
const AUTH_FILE = path.resolve(__dirname, '../rotoplas-auth-b2c.json');
const HAY_SESION = fs.existsSync(AUTH_FILE);
if (HAY_SESION) test.use({ storageState: AUTH_FILE });

/**
 * Garantiza que el carrito tenga al menos un item, manejando la race entre la
 * confirmación optimista (drawer) y la persistencia en backend: tras agregar
 * espera el settle del servidor y recarga /cart/ una vez si aún no aparece.
 * Deja la página en /cart/.
 */
async function asegurarItemEnCarrito(page) {
  await irA(page, '/cart/');
  if (await page.locator('.line-cart-item').count() > 0) return;

  await irA(page, PRODUCTO.slug);
  await page.locator('button.buy').first().click();
  await page.waitForTimeout(3500); // settle del backend (UI optimista ≠ persistencia)

  await irA(page, '/cart/');
  if (await page.locator('.line-cart-item').count() === 0) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
  }
}

test.describe('@contract @auth Ruta del dinero (autenticada)', () => {
  test.skip(!HAY_SESION, 'Sin sesión B2C (rotoplas-auth-b2c.json). Corre `npm run auth:b2c` para generarla. No es regresión del sitio.');
  // Estos tests mutan un carrito/cuenta COMPARTIDO → no pueden correr en paralelo
  // (se pisan entre sí). Modo serial: mismo worker, en orden. Los demás specs
  // (stateless) siguen corriendo en paralelo normalmente.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedCobertura(page, COBERTURA_SEED);
  });

  test('Sesión activa: el header NO muestra "Inicia sesión"', async ({ page }) => {
    await irA(page, '/');
    await expect(page.getByText('Inicia sesión o regístrate')).toHaveCount(0);
  });

  test('PDP → "Agregar a carrito" muestra confirmación', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    await page.locator('button.buy').first().click();
    // Mini-cart drawer post-add (I.13) confirma la acción.
    await expect(
      page.getByText(/Añadiste este art[ií]culo a tu carrito/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('/cart/ — item persistido + resumen + gating de T&C', async ({ page }) => {
    await asegurarItemEnCarrito(page);

    // El item persiste autenticado (a diferencia del anónimo, BUG-481).
    await expect(page.locator('.line-cart-item').first()).toBeVisible();
    await expect(page.getByText('Total:').first()).toBeVisible();
    await expect(page.getByText(/Incluye IVA/).first()).toBeVisible();

    // Gating legal: "Iniciar compra" arranca DESHABILITADO hasta aceptar T&C
    // (invariante de UX correcto — load-bearing; ver II.5 §5).
    await expect(page.locator('.button-primary').first()).toBeDisabled();
    // El link de T&C debe existir (hoy apunta a -serviciados, BUG-461, pero existe).
    await expect(
      page.locator('a[href*="terminos-y-condiciones"]').first()
    ).toBeAttached();
  });

  test('/checkout/1/ — paso Dirección con su stepper', async ({ page }) => {
    await asegurarItemEnCarrito(page);
    await irA(page, '/checkout/1/');

    // El stepper de 3 pasos es el esqueleto del checkout (Dirección·Información·Pago).
    for (const paso of ['Dirección', 'Información', 'Pago']) {
      await expect(
        page.getByText(paso, { exact: true }).first(),
        `Checkout: falta el paso "${paso}" en el stepper`
      ).toBeVisible();
    }
    // CTA load-bearing del paso 1: avanzar con la dirección.
    await expect(
      page.getByRole('button', { name: /usar esta direcci[oó]n/i }).first()
    ).toBeVisible();
  });

  test('/checkout/2/ — Información de contacto con campos precargados', async ({ page }) => {
    await asegurarItemEnCarrito(page);
    await irA(page, '/checkout/1/');
    // Avanzar a paso 2
    await page.getByRole('button', { name: /usar esta direcci[oó]n/i }).first().click();
    await page.waitForURL(/\/checkout\/2\//, { timeout: 20000 });
    await page.waitForTimeout(2000);

    // H3 "Información de contacto"
    await expect(
      page.getByRole('heading', { name: /información de contacto/i }).first()
    ).toBeVisible({ timeout: 5000 });
    // Campos readonly precargados desde la cuenta (pueden estar hidden pero attached)
    await expect(page.locator('input[name="name"], input[name="firstName"]').first()).toBeAttached({ timeout: 5000 });
    await expect(page.locator('input[name="lastName"], input[name="lastname"]').first()).toBeAttached({ timeout: 5000 });
    // Email puede estar hidden (BUG-005 duplicado desktop/mobile)
    await expect(page.locator('input[name="email"]').first()).toBeAttached({ timeout: 5000 });
    // CTA para avanzar
    await expect(
      page.getByRole('button', { name: /continuar/i }).first()
    ).toBeVisible();
  });

  test('/checkout/3/ — Métodos de pago y formulario de tarjeta', async ({ page }) => {
    await asegurarItemEnCarrito(page);
    await irA(page, '/checkout/1/');
    await page.getByRole('button', { name: /usar esta direcci[oó]n/i }).first().click();
    await page.waitForURL(/\/checkout\/2\//, { timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /continuar/i }).first().click();
    await page.waitForURL(/\/checkout\/3\//, { timeout: 20000 });
    await page.waitForTimeout(3000);

    // Métodos de pago: .check-card con radio-like behavior (BUG-473)
    const cards = page.locator('.check-card');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2); // al menos Tarjeta + Transferencia

    // Formulario de tarjeta (visible cuando Tarjeta es el método default)
    await expect(page.locator('input[name="cc-name"]').first()).toBeVisible();
    await expect(page.locator('input[name="cc-number"]').first()).toBeVisible();
    await expect(page.locator('input[name="cc-exp"]').first()).toBeVisible();
    await expect(page.locator('input[name="cc-csc"]').first()).toBeVisible();

    // T&C checkbox + botón de pago (disabled hasta aceptar T&C)
    const pagar = page.getByRole('button', { name: /pagar/i }).first();
    await expect(pagar).toBeVisible();
  });
});
