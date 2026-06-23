// tests/1-login.smoke.spec.js
// CAPA 2 (N2 · EFECTO REAL) — LOGIN camino feliz: credenciales válidas → SESIÓN.
//
// QUÉ AÑADE sobre 1-forms (N0/N1): 1-forms verifica que el form de login renderice y
// que RECHACE lo inválido (vacío, email malformado, credenciales falsas). ESTE spec hace
// el CAMINO FELIZ: teclea credenciales REALES como un usuario y verifica el EFECTO ←
// la sesión se establece (sale de /login + el header deja de ser anónimo). Es la
// diferencia entre "el login rechaza" y "el login deja entrar a quien debe".
//
// Imita al usuario real (decisión de diseño #6): teclea email+password char por char en
// un contexto ANÓNIMO (el proyecto trae storageState:undefined) — no inyecta cookies.
//
// PROD-SAFETY: usa la cuenta de QA c.agarcia (NO registrada en prod → allí el login
// fallaría por datos, no por regresión). QA-only. MUTANTE de sesión → @smoke (on-demand,
// fuera del run rápido). Correr: npm run check:b2c:login
//
// Tag: @smoke @login

const { test, expect, irA } = require('./_helpers');

const IS_PROD = /rotoplas\.com\.mx/i.test(process.env.B2C_BASE_URL || '');
const CREDS = {
  email:    process.env.B2C_USER || 'c.agarcia@rotoplas.com',
  password: process.env.B2C_PASS || 'Rotoplas2026',
};

test.describe('@smoke @login Login camino feliz — credenciales válidas establecen sesión', () => {
  test.skip(IS_PROD, 'Usa la cuenta de QA c.agarcia (no registrada en prod). QA-only.');

  test('Tecleo de credenciales válidas → redirige fuera de /login + header autenticado', async ({ page }) => {
    await irA(page, '/login', 2800);

    // Tecleo real char-por-char (como loginUI de crear-orden-b2c). El form es Qwik:
    // el botón requiere CLICK REAL/CDP (locator.click() de Playwright ya lo es).
    const email = page.locator('input#email, input[placeholder*="Correo"]').first();
    await email.click();
    await email.pressSequentially(CREDS.email, { delay: 40 });
    const pass = page.locator('input[type="password"]').first();
    await pass.click();
    await pass.pressSequentially(CREDS.password, { delay: 40 });

    await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).first().click();

    // EFECTO N2 #1: sale de /login (redirect a home o /customer).
    await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 });
    expect(page.url()).not.toContain('/login');

    // EFECTO N2 #2: el header ya NO ofrece iniciar sesión → sesión real establecida.
    await expect(page.getByText('Inicia sesión o regístrate')).toHaveCount(0);
  });
});
