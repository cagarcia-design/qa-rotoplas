// tests/contracts/b2c/2-customer.contract.spec.js
// CAPA 1 · CONTRACT — Área de cliente /customer/* (autenticado).
// Verifica que las páginas del área de cuenta rendericen contenido (no estén
// en blanco ni redirijan a error). Los selectores son deliberadamente laxos
// porque el área de cliente tiene DOM duplicado (BUG-005/100), clases con typo
// (menuDEsk, BUG-099) y comportamiento variable según estado de sesión.
//
// Requiere auth (storageState). Modo serial.
//
// Tag: @contract @auth

const { test, expect, irA } = require('./_helpers');

test.describe('@contract @auth Área de cliente', () => {
  test.describe.configure({ mode: 'serial' });

  test('/customer — Página de datos del usuario renderiza', async ({ page }) => {
    await irA(page, '/customer');
    // Si la sesión expiró, redirige a login → el body contiene "Inicia sesión".
    // Eso es un falso negativo del contrato (sesión, no regresión).
    const onLogin = page.getByText(/inicia sesión/i).first();
    if (await onLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip('sesión expirada — no es regresión del sitio');
    }
    // La página debe tener contenido sustancial (no "Ha ocurrido un error")
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text.length).toBeGreaterThan(80);
    expect(text).not.toMatch(/ha ocurrido un error/i);
  });

  test('/customer/orders — Listado de pedidos renderiza', async ({ page }) => {
    await irA(page, '/customer/orders');
    const onLogin = page.getByText(/inicia sesión/i).first();
    if (await onLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip('sesión expirada');
    }
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/ha ocurrido un error/i);
  });

  test('/customer/address — Direcciones renderiza', async ({ page }) => {
    await irA(page, '/customer/address');
    const onLogin = page.getByText(/inicia sesión/i).first();
    if (await onLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip('sesión expirada');
    }
    const body = page.locator('main, [role="main"], body').first();
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/ha ocurrido un error/i);
  });

});
