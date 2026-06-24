// tests/1-forms.contract.spec.js
// CAPA 1 · CONTRACT — Formularios públicos del área Mi cuenta.
// Verifica que los formularios de login, signup y recuperación de contraseña
// rendericen sus campos y respondan al submit (sin depender de auth ni de datos
// reales). Lo que, si desaparece, es incidente P1.
//
// NOTA (taxonomía s29): el formulario de SEGUIMIENTO de pedido salió de aquí a
// `2-seguimiento.contract.spec.js` (área Compra, post-venta anónimo). Este spec
// quedó acotado a los forms de Mi cuenta y se sumó a AREAS.cuenta.files.
//
// Anclajes estables del inventario I.14.a-c. Sin clases hash de Qwik.
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

  // N1 (comportamiento) — el formato de email se valida en cliente ANTES de pegarle
  // al backend (inventario I.14.a: vacío y malformado dan el MISMO error). No hay
  // submit al servidor ni correo → prod-safe. Profundiza de "el form renderiza" a
  // "el form valida".
  test('Email mal formado dispara la validación de formato (no envía)', async ({ page }) => {
    await irA(page, '/login/');
    await page.locator('input[name="email"]').first().fill('correo-sin-arroba');
    await page.locator('input[type="password"]').first().fill('cualquiercosa123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(
      page.getByText(/correo electrónico válida/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  // N1 (comportamiento de SEGURIDAD) — invariante load-bearing: credenciales que NO
  // existen NUNCA deben autenticar. Hace el submit REAL al endpoint de auth (con un
  // email-cebo que no es cuenta de nadie → no bloquea a un usuario real, no muta, no
  // dispara correo) y verifica el efecto: sigue anónimo. Esto distingue "el botón
  // existe" de "el login realmente rechaza". Prod-safe.
  test('Credenciales inválidas NO autentican (queda anónimo)', async ({ page }) => {
    await irA(page, '/login/');
    await page.locator('input[name="email"]').first().fill('noexiste.qa.smoke@example.com');
    await page.locator('input[type="password"]').first().fill('PasswordIncorrecto123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForTimeout(4000); // settle de la respuesta del backend de auth

    // Invariante de seguridad: el header sigue ofreciendo iniciar sesión → NO autenticó.
    // (Ancla estable reusada de money-path / setup-auth, no copy del mensaje de error.)
    await expect(page.getByText('Inicia sesión o regístrate').first()).toBeVisible();
    // Y no redirigió fuera de /login (un login exitoso saldría a home o /customer).
    expect(page.url()).toContain('/login');
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

  // N1 — email mal formado dispara la misma validación de formato (cliente, sin
  // envío real). Prod-safe. El camino feliz (email válido → correo de reset llega
  // al inbox) vive en el spec N2 `4-forms-email.smoke.spec.js` porque requiere
  // acceso al inbox (IMAP) y una cuenta registrada.
  test('Email mal formado dispara la validación de formato', async ({ page }) => {
    await irA(page, '/forgot-password/');
    await page.locator('input[name="email"]').first().fill('correo-sin-arroba');
    await page.getByRole('button', { name: /enviar correo/i }).click();
    await expect(
      page.getByText(/correo electrónico válida/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
