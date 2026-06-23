// tests/1-home.contract.spec.js
// CAPA 1 · CONTRACT — Home (anónima). La puerta de entrada del sitio.
// Anclajes estables del inventario II.1 (fresco). El cascarón global (header/
// footer/nav) ya lo cubre 1-global-layout; aquí solo las secciones únicas de home.
//
// Correr: npm run check:b2c:contracts

const { test, expect, irA, bugConocido } = require('./_helpers');

test.describe('@contract Home — secciones clave', () => {

  test('Hero carrusel de banners presente', async ({ page }) => {
    await irA(page, '/');
    // Anclaje: al menos un banner del hero VISIBLE. Se ancla por la clase de autor
    // `responsive-image` + alt que empieza con "Banner". Cubre tanto el alt genérico
    // viejo ("Banner Rotoplas") como los descriptivos nuevos ("Banner Goles",
    // "Banner Tuboplus", "Banner Tinaco Vertical"…) — el sitio mejoró los alts el
    // 2026-06-15 (posible fix parcial de BUG-517: verificar y, si procede, cerrarlo).
    // `:visible` descarta las copias duplicadas ocultas (BUG-005). Antes anclaba el
    // alt genérico exacto y se puso rojo cuando el sitio lo cambió A PROPÓSITO.
    await expect(
      page.locator('img.responsive-image[alt^="Banner"]:visible').first()
    ).toBeVisible();
  });

  test('Selector de soluciones "¿Qué necesitas solucionar hoy?" presente', async ({ page }) => {
    await irA(page, '/');
    // Widget de conversión clave. Anclaje: texto exacto del heading.
    await expect(
      page.getByText('¿Qué necesitas solucionar hoy?').first()
    ).toBeVisible();
  });

  // Nota: "Por qué elegirnos" y demás secciones profundas de la home NO se
  // contractean: son contenido marketing (no P1) y montan de forma perezosa
  // (top>4000px) → flaky. El filtro de criticidad las deja fuera a propósito.
});

// ─────────────────────────────────────────────────────────────────────────
// BASELINE EJECUTABLE — la home HOY no tiene H1 (BUG-B2C-001, sistémico).
// ─────────────────────────────────────────────────────────────────────────
test.describe('@contract Home — Baseline de bugs conocidos', () => {

  bugConocido(test, 'BUG-B2C-001',
    'La home debería tener un <h1> (hoy no tiene ninguno — sistémico BUG-353)',
    async ({ page }) => {
      await irA(page, '/');
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    });
});
