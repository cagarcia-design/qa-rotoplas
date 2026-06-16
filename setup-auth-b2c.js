/**
 * Setup de autenticación B2C (qarotoplasmx.io) para los contracts de Cart/Checkout.
 *
 * El carrito B2C está gated por login: el add-to-cart anónimo no persiste
 * (BUG-B2C-481). Por eso los contracts de /cart/ y /checkout/* necesitan una
 * sesión real. Este script hace login UNA VEZ y guarda el storageState.
 *
 * Correr cuando la sesión expire:  node setup-auth-b2c.js
 * Salida: rotoplas-auth-b2c.json  (gitignored — contiene cookies de sesión)
 *
 * El sitio B2C NO tiene bot detection (a diferencia del B2B), así que el login
 * automatizado funciona sin parches de navigator.webdriver.
 */

const { chromium } = require('playwright');
const path = require('path');

const CREDENTIALS = {
  email: process.env.B2C_USER || 'andrei.garcia@xideral.co',
  password: process.env.B2C_PASS || 'Rotoplas2027',
};

const BASE = process.env.B2C_BASE_URL || 'https://qarotoplasmx.io';
const AUTH_FILE = path.join(__dirname, 'rotoplas-auth-b2c.json');
const HEADED = process.env.HEADED === '1';

(async () => {
  console.log('Setup de autenticación B2C — qarotoplasmx.io');
  const browser = await chromium.launch({ channel: 'chrome', headless: !HEADED });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navegando al login...');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500); // hidratación Qwik

  // Form de login (inventario I.14.a): input#email + input[type=password] +
  // button "Iniciar sesión". No usa <form> semántico; el submit es un handler Qwik.
  console.log('Llenando credenciales...');
  await page.locator('input#email, input[placeholder*="Correo"]').first().fill(CREDENTIALS.email);
  await page.locator('input[type="password"]').first().fill(CREDENTIALS.password);

  // Click REAL (CDP) — requerido por Qwik para sincronizar el signal del botón.
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).first().click();
  console.log('Credenciales enviadas. Esperando redirect...');

  // Login exitoso → sale de /login (a home o /customer).
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  if (finalUrl.includes('/login')) {
    const err = await page.evaluate(() => {
      const e = document.querySelector('span.error, [class*="error"]');
      return e ? e.textContent.trim() : '(sin mensaje de error visible)';
    });
    console.error('ERROR: el login no avanzó. Sigue en /login.');
    console.error('Mensaje:', err);
    await browser.close();
    process.exit(1);
  }

  // Verificar sesión real: el header ya no debe ofrecer "Inicia sesión".
  const anon = await page.getByText('Inicia sesión o regístrate').count();
  if (anon > 0) {
    console.error('ERROR: tras el submit el header sigue anónimo — sesión no establecida.');
    await browser.close();
    process.exit(1);
  }

  await context.storageState({ path: AUTH_FILE });
  console.log(`\n✓ Sesión B2C guardada en: ${AUTH_FILE}`);
  console.log(`✓ URL final: ${finalUrl}`);
  await browser.close();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
