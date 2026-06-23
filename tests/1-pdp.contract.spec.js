// tests/1-pdp.contract.spec.js
// CAPA 1 · CONTRACT — PDP (plantilla). Producto de referencia: "Base para tinaco
// GDPV" (SKU 310002), elegido por estar disponible para CP 02800 y tener un H1
// limpio (sin el TEST TINACO del 500545). Ver hallazgos F6 #1-#3 en overview.
//
// Asertamos la PLANTILLA, no datos del SKU: que renderice título, un precio, el
// botón de compra HABILITADO y el stepper. Sembramos cobertura por localStorage
// para que la disponibilidad sea determinista sin caminar el modal de CP.
//
// Correr: npm run check:b2c:contracts

const { test, expect, irA, seedCobertura } = require('./_helpers');
const { PRODUCTO, COBERTURA_SEED } = require('./_targets');

test.describe('@contract PDP — plantilla de producto', () => {

  test.beforeEach(async ({ page }) => {
    await seedCobertura(page, COBERTURA_SEED);
  });

  test('Título (H1) del producto presente', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    await expect(
      page.getByRole('heading', { level: 1, name: PRODUCTO.nombre })
    ).toBeVisible();
  });

  test('Precio visible (formato moneda)', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    // Anclaje: clase legible estable. La principal es variant-larger.
    const precio = page.locator('.dynamic-price.variant-larger').first();
    await expect(precio).toBeVisible();
    await expect(precio).toContainText(/\$[\d,]+\.\d{2}/);
  });

  test('Botón "Agregar a carrito" presente y habilitado (con cobertura)', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    // Anclaje: clase del CTA principal (.buy). El cross-sell usa .addtoCart con
    // texto "Agregar AL carrito" (distinto del principal "Agregar A carrito").
    const addToCart = page.locator('button.buy').first();
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
  });

  test('Stepper de cantidad presente', async ({ page }) => {
    await irA(page, PRODUCTO.slug);
    await expect(page.locator('button.decreasebutton').first()).toBeVisible();
    await expect(page.locator('button.increasebutton').first()).toBeVisible();
  });

  // Nota: la disponibilidad NO se asercióna por el texto "Disponible para C.P.X"
  // (cosmético, depende del banner de dirección). El botón "Agregar a carrito"
  // HABILITADO de arriba es el invariante load-bearing de disponibilidad.
});
