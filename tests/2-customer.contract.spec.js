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

const path = require('path');
const fs = require('fs');
const { test, expect, irA } = require('./_helpers');

// Sesión autenticada B2C — igual que 2-money-path. SIN esto el spec corría ANÓNIMO
// (el proyecto trae storageState:undefined) → /customer redirigía a login → los 3
// tests hacían skip SIEMPRE, no solo con sesión expirada. Cargar la sesión aquí es
// lo que hace que el área de cliente realmente se ejerza logueada. Si el archivo no
// existe, skip limpio a nivel describe (no es regresión del sitio).
const AUTH_FILE = path.resolve(__dirname, '../rotoplas-auth-b2c.json');
const HAY_SESION = fs.existsSync(AUTH_FILE);
if (HAY_SESION) test.use({ storageState: AUTH_FILE });

test.describe('@contract @auth Área de cliente', () => {
  test.skip(!HAY_SESION, 'Sin sesión B2C (rotoplas-auth-b2c.json). Corre `npm run auth:b2c`. No es regresión del sitio.');
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
