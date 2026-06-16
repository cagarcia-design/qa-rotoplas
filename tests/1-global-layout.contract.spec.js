// tests/contracts/b2c/1-global-layout.contract.spec.js
// CAPA 1 · CONTRACT — Cascarón global (header + nav + footer).
// Estos componentes viven en TODA página → un break aquí es global → máxima
// prioridad. Por eso es el primer contract.
//
// Selectores: derivados del inventario (Parte I, fresco s11-s13) pero traducidos
// a anclajes ESTABLES (tag semántico, href de producto, texto visible). NUNCA
// clases hash de Qwik. Anónimo (el proyecto no carga sesión por defecto).
//
// Correr: npm run check:b2c:contracts   (o npm run check:b2c para todo)

const { test, expect, irA, bugConocido, scrollAlFondo } = require('./_helpers');

test.describe('@contract Cascarón global — Header', () => {

  test('Header presente con logo, buscador, acceso a login y carrito', async ({ page }) => {
    await irA(page, '/');

    // El <header> semántico debe existir (raíz del cascarón).
    await expect(page.locator('header')).toBeVisible();

    // Logo de Rotoplas (imagen desde CDN Builder). Anclaje: alt estable.
    await expect(page.locator('header img[alt="logo"]')).toBeVisible();

    // Buscador del catálogo. Anclaje: placeholder de producto (hay 2 inputs con
    // el mismo id por BUG-016 → .first() evita el strict-mode violation).
    await expect(
      page.getByPlaceholder('Encuentra lo que buscas aquí...').first()
    ).toBeVisible();

    // Acceso a login (estado anónimo). Anclaje: texto visible.
    await expect(
      page.getByText('Inicia sesión o regístrate').first()
    ).toBeVisible();

    // Acceso al carrito. Anclaje: href de producto (en el header es "/cart").
    await expect(page.locator('header a[href="/cart"]').first()).toBeVisible();
  });
});

test.describe('@contract Cascarón global — Nav', () => {

  test('Links de navegación clave presentes con su href correcto', async ({ page }) => {
    await irA(page, '/');

    // Hay 2 <nav> (mobile + desktop) con copia de cada link → .first().
    // Anclaje: href de producto, no texto (el texto tiene typos conocidos).
    const navLinks = [
      { nombre: 'Conócenos', href: '/nosotros/' },
      { nombre: 'Recursos', href: '/recursos/' },
    ];
    for (const { nombre, href } of navLinks) {
      await expect(
        page.locator(`a[href="${href}"]`).first(),
        `Nav: falta el link a ${href} (${nombre})`
      ).toBeAttached();
    }
  });
});

test.describe('@contract Cascarón global — Footer', () => {

  test('Footer presente con links legales y de categoría', async ({ page }) => {
    await irA(page, '/');
    // El footer (y el contenido profundo) monta de forma perezosa en Qwik →
    // scroll al fondo para forzar el render antes de asertar (evita falso negativo).
    await scrollAlFondo(page);

    // toBeAttached (presencia en DOM) es el invariante load-bearing del footer;
    // toBeVisible añade riesgo de timing por el lazy-render bajo carga paralela.
    await expect(page.locator('footer')).toBeAttached();

    // Links legales — load-bearing por cumplimiento. Anclaje: href.
    // .first(): el footer se renderiza duplicado en el DOM (BUG-B2C-005).
    const legales = ['/aviso-de-privacidad', '/terminos-y-condiciones'];
    for (const href of legales) {
      await expect(
        page.locator(`footer a[href="${href}"]`).first(),
        `Footer: falta link legal ${href}`
      ).toBeAttached();
    }

    // Al menos una categoría de producto debe linkear desde el footer.
    await expect(
      page.locator('footer a[href="/products/almacenamiento/"]').first()
    ).toBeAttached();

    // Copyright corporativo (texto estable de marca, año aparte).
    await expect(
      page.getByText(/Rotoplas S\.A\. de C\.V\./).first()
    ).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// BASELINE EJECUTABLE — bugs conocidos del cascarón marcados como expected-fail.
// Si alguno PASA, el bug se arregló → cerrarlo en el inventario (Parte IV).
// ─────────────────────────────────────────────────────────────────────────
test.describe('@contract Cascarón global — Baseline de bugs conocidos', () => {

  bugConocido(test, 'BUG-B2C-015',
    'El logo debería ser un <a href="/"> real (hoy es <div on:click>, mal para SEO)',
    async ({ page }) => {
      await irA(page, '/');
      // El invariante DESEADO: el logo es un ancla navegable al home.
      await expect(page.locator('header a[href="/"]:has(img[alt="logo"])')).toBeVisible();
    });

  bugConocido(test, 'BUG-B2C-003',
    'El link "Contacto" del nav debería apuntar a /contacto/ (hoy va a FAQ)',
    async ({ page }) => {
      await irA(page, '/');
      // El invariante DESEADO: existe un link de texto "Contacto" hacia /contacto/.
      await expect(
        page.locator('nav a[href="/contacto/"]', { hasText: 'Contacto' }).first()
      ).toBeVisible();
    });
});
