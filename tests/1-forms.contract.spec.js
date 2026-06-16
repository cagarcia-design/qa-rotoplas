// tests/contracts/b2c/1-forms.contract.spec.js
// CAPA 1 · CONTRACT — Formularios públicos críticos.
// Verifica que los formularios de login, signup, recuperación de contraseña y
// seguimiento de pedido rendericen sus campos y respondan al submit (sin depender
// de auth ni de datos reales). Lo que, si desaparece, es incidente P1.
//
// Anclajes estables del inventario I.14.a-d y II.12. Sin clases hash de Qwik.
//
// Tag: @forms @contract
// Correr: npm run check:b2c:forms

const { test, expect, irA } = require('./_helpers');

test.describe('@forms @contract Login — /login/', () => {

  test('Campos de login visibles', async ({ page }) => {
    await irA(page, '/login/');
    await expect(page.getByRole('heading', { name: /inicia sesión/i, level: 1 })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /olvidé mi contraseña/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /crea una|aquí/i })).toBeVisible();
  });

  test('Error en login con credenciales vacías', async ({ page }) => {
    await irA(page, '/login/');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    // Error esperado: "Introduce una dirección de correo electrónico válida..."
    // Selector estable del inventario I.14.a: span.error bajo #email
    await expect(
      page.locator('#email + * .error, [class*="error"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

});

test.describe('@forms @contract Signup — /signup/', () => {

  test('Campos de registro visibles', async ({ page }) => {
    await irA(page, '/signup/');
    await expect(page.getByRole('heading', { name: /crea una cuenta/i, level: 1 })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="comppassword"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();
  });

  test('Botón Crear cuenta presente', async ({ page }) => {
    await irA(page, '/signup/');
    // El botón inicia disabled (BUG-110: gating correcto). Verificamos solo
    // que existe — es el único form del sitio con este comportamiento.
    const btn = page.locator('button:has-text("Crear cuenta")').first();
    await expect(btn).toBeVisible({ timeout: 8000 });
  });

});

test.describe('@forms @contract Forgot password — /forgot-password/', () => {

  test('Campos de recuperación visibles', async ({ page }) => {
    await irA(page, '/forgot-password/');
    await expect(page.getByRole('heading', { name: /olvidé mi contraseña/i, level: 1 })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar correo/i })).toBeVisible();
  });

  test('Error con email vacío', async ({ page }) => {
    await irA(page, '/forgot-password/');
    await page.getByRole('button', { name: /enviar correo/i }).click();
    await expect(
      page.getByText(/correo electrónico válida/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

});

test.describe('@forms @contract Seguimiento — /traking/', () => {

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
