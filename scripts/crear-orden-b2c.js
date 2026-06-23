// scripts/crear-orden-b2c.js
// PIEZA 1 del check Capa 2 — crea una orden B2C FRESCA por la UI (checkout E2E real).
//
// POR QUÉ ESTE SCRIPT EXISTE:
// El check @capa2 mueve el status de una orden vía CT y verifica los correos, pero
// necesita una orden FRESCA en Open por corrida (los estados se "queman": el
// microservicio notifica-una-vez). Antes esa orden se creaba a mano por la UI. Este
// script la automatiza: login → PDP → carrito → checkout 3 pasos → "Pagar" (tarjeta
// sandbox 4242) → captura el orderNumber de /order/[n]/.
//
// CUENTA: c.agarcia@rotoplas.com (su inbox es legible por Gmail MCP / IMAP → habilita
// la verificación de correo).
//
// SESIÓN (s24): por DEFAULT el flujo TECLEA email+password en /login como un usuario
// real (B2C_LOGIN_MODE=type) → la compra es E2E completa incluyendo login. El modo
// rápido B2C_LOGIN_MODE=session reusa el storageState rotoplas-auth-b2c-capa2.json
// (para CI/pipeline). Ver conSesion()/loginUI().
//
// QUIRKS Qwik manejados (ver .claude/rules/tests.md):
//   - domcontentloaded + settle; NUNCA networkidle (QuantumMetrics nunca queda idle).
//   - checkboxes/toggles T&C requieren CLICK REAL (CDP) → locator.click() de Playwright
//     ya es CDP real (a diferencia de el.click() en JS, que no sincroniza el signal).
//   - campo MM/AA (cc-exp) con pressSequentially, no fill (auto-formato).
//   - add-to-cart: UI optimista ≠ persistencia → settle del backend antes de /cart/.
//
// USO CLI:
//   node scripts/crear-orden-b2c.js                 → imprime "CAPA2_ORDER=6XXXXXXXXXX"
//   HEADED=1 node scripts/crear-orden-b2c.js        → con ventana (debug)
// USO MÓDULO (globalSetup):
//   const { crearOrdenB2C } = require('./crear-orden-b2c');
//   const orderNumber = await crearOrdenB2C();

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.B2C_BASE_URL || 'https://qarotoplasmx.io';
const AUTH = path.resolve(__dirname, '..', 'rotoplas-auth-b2c-capa2.json');
const EVID = path.resolve(__dirname, '..', 'evidencias');
const HEADED = process.env.HEADED === '1';

// Producto de prueba: BASE-PARA-TINACO (SKU 310002). Comprable para la dirección
// default de c.agarcia (Oficina, CP 03100) — verificado en vivo (buyDisabled:false).
const PRODUCTO_SLUG = process.env.CAPA2_PRODUCT_SLUG || '/product/BASE-PARA-TINACO/';

// TIPO de orden a crear: 'fisico' (default, producto físico) | 'servicio' (lavado de tinaco).
// El servicio se compra por el wizard de /servicios-lavado/ → cart line-item .service-card
// (SKU 452308 "Mantenimiento Tinaco"), luego mismo checkout estándar. Ver inventario II.16.c/d.
const TIPO = (process.env.CAPA2_TIPO || 'fisico').toLowerCase();

// Landing del servicio + pin de variante A/B Builder.io (BUG-B2C-457). El trigger
// "Cotizar lavado" es una IMG (no botón de texto); su variante se sirve por hash del
// builderVisitorId → fijamos uno conocido-bueno que rinde la variante CON wizard.
const SERVICIO_SLUG = process.env.CAPA2_SERVICIO_SLUG || '/servicios-lavado/';
const BUILDER_VISITOR_WIZARD = process.env.CAPA2_BUILDER_VISITOR || 'fc50bc243814433baf628a1bf231ca18';

// MÉTODO DE PAGO a usar en el checkout. El flujo imita a un usuario real:
//   credito/debito → llena el formulario de tarjeta y pulsa "Pagar".
//   transferencia/efectivo → selecciona la .check-card (div con radio-like, BUG-473) y
//                            pulsa "Generar pedido" (el botón cambia de "Pagar").
// Los 4 terminan en /order/[orderNumber]/ (tarjeta/efectivo = "compra exitosa";
// transferencia = "¡Solo falta un paso!"). Ver inventario §9 (Transferencia/Efectivo).
const PAGO = (process.env.CAPA2_PAGO || 'credito').toLowerCase();

// MODO DE SESIÓN (s24, pedido por el usuario):
//   'type'    (DEFAULT) → arranca SIN cookies y TECLEA email+password en /login como
//                         un usuario real (el B2C no tiene bot detection → es fiable).
//                         El flujo de compra incluye así el login completo de punta a punta.
//   'session'           → carga el storageState pre-autenticado (rápido, para CI/pipeline).
const LOGIN_MODE = (process.env.B2C_LOGIN_MODE || 'type').toLowerCase();
const LOGIN_CREDS = {
  email:    process.env.B2C_USER || 'c.agarcia@rotoplas.com',
  password: process.env.B2C_PASS || 'Rotoplas2026',
};

// Tarjetas sandbox OpenPay que SIEMPRE aprueban (test-data/cards.js).
//   crédito → Visa 4242 · débito → Visa débito 4111 (ambas aprueban en sandbox).
const TARJETAS = {
  credito: { nombre: 'Jorge Rotoplas', numero: '4242424242424242', exp: '1230', cvv: '123' },
  debito:  { nombre: 'Jorge Rotoplas', numero: '4111111111111111', exp: '1230', cvv: '123' },
};

const log = (msg) => console.error(`[crear-orden-b2c] ${msg}`); // a stderr → stdout queda limpio para CAPA2_ORDER=

async function shot(page, nombre) {
  try {
    if (!fs.existsSync(EVID)) fs.mkdirSync(EVID, { recursive: true });
    await page.screenshot({ path: path.join(EVID, `CAPA2-crear-${nombre}.png`) });
  } catch (e) { log(`screenshot ${nombre} falló: ${e.message}`); }
}

async function irA(page, ruta, settle = 2800) {
  await page.goto(ruta.startsWith('http') ? ruta : `${BASE}${ruta}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(settle);
}

/**
 * Clic en el primer elemento VISIBLE que matchea el locator. El B2C duplica nodos
 * desktop/mobile en el DOM y oculta uno con CSS (BUG-B2C-005) → .first() puede
 * agarrar la copia oculta y colgar. Esto recorre las copias y clickea la visible.
 */
async function clickVisible(page, locator, desc = 'elemento', timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const n = await locator.count();
    for (let i = 0; i < n; i++) {
      const el = locator.nth(i);
      if (await el.isVisible().catch(() => false)) {
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await el.click();
        return true;
      }
    }
    await page.waitForTimeout(400);
  }
  throw new Error(`clickVisible: ningún "${desc}" visible tras ${timeoutMs}ms`);
}

/**
 * Login por la UI tecleando email + password como un usuario real (modo 'type').
 * El B2C NO tiene bot detection → el login automatizado es fiable (igual que
 * setup-auth-b2c.js). Form (inventario I.14.a): input#email + input[type=password] +
 * botón "Iniciar sesión" (handler Qwik → requiere CLICK REAL/CDP).
 */
async function loginUI(page) {
  await irA(page, '/login', 2800);
  const emailInput = page.locator('input#email, input[placeholder*="Correo"]').first();
  // Si ya hubiera sesión (no debería en contexto limpio), no hay form → saltar.
  if (await emailInput.count() === 0) { log('login: no hay form (¿sesión ya activa?) — salto'); return; }

  log('login: tecleando usuario y contraseña como un usuario real');
  await emailInput.click();
  await emailInput.pressSequentially(LOGIN_CREDS.email, { delay: 45 });     // tecleo real, char por char
  const pass = page.locator('input[type="password"]').first();
  await pass.click();
  await pass.pressSequentially(LOGIN_CREDS.password, { delay: 45 });
  await shot(page, '00-login-lleno');

  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).first().click();  // CDP real (Qwik)
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    const err = await page.evaluate(() => {
      const e = document.querySelector('span.error, [class*="error"]');
      return e ? e.textContent.trim() : '(sin mensaje de error visible)';
    }).catch(() => '');
    await shot(page, '00-login-fallo');
    throw new Error(`login no avanzó (sigue en /login). ${err}`);
  }
  if (await page.getByText('Inicia sesión o regístrate').count() > 0) {
    await shot(page, '00-login-anon'); throw new Error('tras el submit el header sigue anónimo — sesión no establecida');
  }
  log('login: sesión iniciada');
}

async function conSesion(fn) {
  const useSession = LOGIN_MODE === 'session';
  if (useSession && !fs.existsSync(AUTH)) {
    throw new Error(`B2C_LOGIN_MODE=session pero falta el storageState ${AUTH}. Genéralo con:\n` +
      `  B2C_USER=c.agarcia@rotoplas.com B2C_PASS=Rotoplas2026 node setup-auth-b2c.js\n` +
      `  (luego copia rotoplas-auth-b2c.json → rotoplas-auth-b2c-capa2.json) — o usa el default (login tecleado).`);
  }
  const browser = await chromium.launch({ channel: 'chrome', headless: !HEADED });
  const ctxOpts = { viewport: { width: 1280, height: 900 } };
  if (useSession) ctxOpts.storageState = AUTH;   // modo rápido: cookies pre-autenticadas
  const ctx = await browser.newContext(ctxOpts);
  // Pin de variante Builder.io (para el wizard del servicio) ANTES de cargar scripts.
  await ctx.addInitScript((vid) => {
    try { localStorage.setItem('builderVisitorId', vid); } catch (e) {}
  }, BUILDER_VISITOR_WIZARD);
  const page = await ctx.newPage();
  try {
    if (useSession) {
      await irA(page, '/');
      if (await page.getByText('Inicia sesión o regístrate').count() > 0) {
        throw new Error('Sesión c.agarcia expirada. Regenera rotoplas-auth-b2c-capa2.json o usa el login tecleado (default).');
      }
      log('sesión c.agarcia activa (storageState)');
    } else {
      await loginUI(page);   // DEFAULT: teclea credenciales como usuario real
    }
    // Limpiar carrito si tiene residuos de una corrida anterior
    await vaciarCarrito(page);
    return await fn(page);
  } finally {
    await browser.close();
  }
}

/** Vacía el carrito si tiene items (evita residuos entre corridas). */
async function vaciarCarrito(page) {
  await irA(page, '/cart/');
  const items = page.locator('.line-cart-item, [class*="service-card"]');
  if (await items.count() === 0) return;
  log(`carrito con ${await items.count()} item(s) — vaciando`);
  const vaciar = page.getByRole('button', { name: /vaciar carrito/i });
  if (await vaciar.count() === 0) return;
  await clickVisible(page, vaciar, 'Vaciar carrito');
  // BUG-513: no hay modal de confirmación → se vacía instantáneamente
  await page.waitForTimeout(1500);
  const quedan = await items.count();
  if (quedan > 0) log(`advertencia: ${quedan} item(s) persisten tras vaciar`);
}

/** Agrega el PRODUCTO FÍSICO de prueba al carrito (PDP → button.buy). */
async function agregarProductoFisico(page) {
  await irA(page, PRODUCTO_SLUG);
  const buy = page.locator('button.buy').first();
  await buy.waitFor({ state: 'visible', timeout: 15000 });
  if (await buy.isDisabled()) { await shot(page, '01-pdp-disabled'); throw new Error('botón comprar disabled — sin cobertura para la dirección default'); }
  await buy.click();
  await page.getByText(/Añadiste este art[ií]culo a tu carrito/i).first()
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => log('drawer de confirmación no visible (continúo)'));
  log('producto físico agregado al carrito');
  await page.waitForTimeout(3500); // settle backend (UI optimista ≠ persistencia)
}

/**
 * Agrega el SERVICIO de lavado al carrito recorriendo el wizard por UI (como un cliente):
 * /servicios-lavado/ → trigger imagen "Cotizar lavado" → modal → Tinaco +1 → Capacidad →
 * Cotizar ($899 client-side) → Agregar al carrito. Selectores verificados en vivo (II.16.c).
 *
 * Trigger anclado a `img[class*="banner-desk"][src*="a634cf17"]` → el ÚNICO visible (las
 * otras 3 copias `banner-mobile` están ocultas, BUG-005). Apertura con hover (nudge
 * qvisible) + reintento de click. Mismo recorrido probado en
 * tests/1-servicio-lavado.contract.spec.js (s21).
 */
async function agregarServicioLavado(page) {
  await irA(page, SERVICIO_SLUG, 3500);

  // 1) Trigger "Cotizar lavado": es una IMG (no botón de texto). Anclamos al banner
  //    DESKTOP con el asset Builder.io (a634cf17) → descarta las 3 copias mobile OCULTAS
  //    (BUG-005) y el hero. Si la variante A/B no lo sirve (BUG-457) → error claro.
  const trigger = page.locator('img[class*="banner-desk"][src*="a634cf17"]').first();
  if (await trigger.count() === 0) {
    await shot(page, '01-servicio-sin-trigger');
    throw new Error('trigger "Cotizar lavado" ausente (variante A/B sin wizard, BUG-457). ' +
      'Reintenta o ajusta CAPA2_BUILDER_VISITOR.');
  }
  await trigger.scrollIntoViewIfNeeded();
  await trigger.hover().catch(() => {}); // nudge a la hidratación qvisible del componente
  await page.waitForTimeout(800);
  // Reintento de click: bajo hidratación lenta el handler Qwik puede no estar cableado
  // al primer click → el modal no abre.
  const contenido = page.locator('.modal-content-wizard');
  for (let intento = 0; intento < 4; intento++) {
    await trigger.click().catch(() => {}); // CDP real → abre .modal-wizard
    try { await contenido.waitFor({ state: 'visible', timeout: 4000 }); break; } catch (_) { /* reintenta */ }
  }
  await contenido.waitFor({ state: 'visible', timeout: 8000 });
  log('wizard abierto');

  // 2) Tinaco +1 (primer button.plus dentro del modal)
  await contenido.locator('button.plus').first().click();
  await page.waitForTimeout(500);

  // 3) Capacidad (dropdown custom) → primera opción
  await page.locator('.dropdown-toggle').first().click();
  await page.locator('.dropdown-item').first().click();
  await page.waitForTimeout(500);

  // 4) Cotizar (button.guardar) — se habilita con cantidad + capacidad
  const cotizar = page.locator('button.guardar', { hasText: /cotizar/i }).first();
  await cotizar.click();
  await page.getByText(/Agregar al carrito/i).first().waitFor({ state: 'visible', timeout: 10000 });
  await shot(page, '01b-servicio-cotizacion');
  log('cotización generada ($899)');

  // 5) Agregar al carrito → mini-cart drawer
  await clickVisible(page, page.getByRole('button', { name: /agregar al carrito/i }), 'Agregar al carrito (servicio)');
  await page.getByText(/Añadiste este art[ií]culo a tu carrito/i).first()
    .waitFor({ state: 'visible', timeout: 12000 }).catch(() => log('drawer de confirmación no visible (continúo)'));
  log('servicio agregado al carrito');
  await page.waitForTimeout(3500); // settle backend
}

/**
 * Carrito → checkout 3 pasos → (Pagar | Generar pedido) → confirmación.
 * Tolera ambos tipos de line-item: producto físico (.line-cart-item) y servicio (.service-card).
 * @param {import('playwright').Page} page
 * @param {string} pago  método: 'credito'|'debito'|'transferencia'|'efectivo' (default = CAPA2_PAGO)
 * @returns {Promise<string>} orderNumber
 */
async function checkoutYPagar(page, pago = PAGO) {
  // 2) Carrito → aceptar T&C → Iniciar compra
  await irA(page, '/cart/');
  const tieneItem = async () =>
    (await page.locator('.line-cart-item').count()) > 0 ||
    (await page.locator('[class*="service-card"]').count()) > 0;
  if (!(await tieneItem())) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
  }
  if (!(await tieneItem())) { await shot(page, '02-cart-vacio'); throw new Error('el carrito quedó vacío tras agregar (persistencia falló)'); }
  await aceptarTyC(page, 'cart');
  await shot(page, '02-cart');
  await clickVisible(page, page.getByRole('button', { name: /iniciar compra/i }), 'Iniciar compra');
  log('Iniciar compra → checkout');

  // 3) Checkout paso 1 — Usar esta dirección
  await page.waitForURL(/\/checkout\/1\//, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await clickVisible(page, page.getByRole('button', { name: /usar esta direcci[oó]n/i }), 'Usar esta dirección');
  log('paso 1: dirección usada');

  // 4) Checkout paso 2 — Continuar
  await page.waitForURL(/\/checkout\/2\//, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await clickVisible(page, page.getByRole('button', { name: /continuar/i }), 'Continuar');
  log('paso 2: información confirmada');

  // 5) Checkout paso 3 — método de pago + T&C → (Pagar | Generar pedido)
  await page.waitForURL(/\/checkout\/3\//, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);

  if (pago === 'transferencia' || pago === 'efectivo') {
    // Métodos sin tarjeta: seleccionar la .check-card por texto (div con radio-like, BUG-473)
    // → el botón de acción cambia a "Generar pedido". Imita al usuario que elige otro método.
    const metodoTexto = pago === 'transferencia' ? /transferencia/i : /efectivo/i;
    await clickVisible(page, page.locator('.check-card').filter({ hasText: metodoTexto }), `método ${pago}`);
    await page.waitForTimeout(1500);
    log(`método de pago: ${pago} (Sin CFDI default)`);
    await aceptarTyC(page, 'checkout');
    await shot(page, `03-checkout-${pago}`);

    await clickVisible(page, page.getByRole('button', { name: /generar pedido/i }), 'Generar pedido');
    // Guard de negocio: no se puede generar otro pedido por transferencia con uno pendiente
    // de pago (toast). Lo detectamos para dar un error claro en vez de un timeout opaco.
    const guard = await page.getByText(/completa la transferencia que tienes pendiente/i).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (guard) { await shot(page, `03-${pago}-guard`); throw new Error('guard de transferencia pendiente: paga/cancela el pedido previo o usa otra cuenta'); }
    log(`Generar pedido (${pago}) → creando orden…`);
  } else {
    // Tarjeta (crédito 4242 | débito 4111) → formulario + "Pagar".
    const tarjeta = TARJETAS[pago] || TARJETAS.credito;
    await page.locator('input[name="cc-name"]').first().fill(tarjeta.nombre);
    await page.locator('input[name="cc-number"]').first().fill(tarjeta.numero);
    const exp = page.locator('input[name="cc-exp"]').first();           // MM/AA → pressSequentially
    await exp.click(); await exp.pressSequentially(tarjeta.exp, { delay: 80 });
    await page.locator('input[name="cc-csc"]').first().fill(tarjeta.cvv);
    log(`tarjeta ${pago} (${tarjeta.numero.slice(-4)}) capturada (Sin CFDI default)`);
    await aceptarTyC(page, 'checkout');
    await shot(page, `03-checkout-${pago}`);

    await clickVisible(page, page.getByRole('button', { name: /^pagar$/i }), 'Pagar');
    log(`Pagar (${pago}) → procesando pago sandbox…`);
  }

  // 6) Confirmación /order/[orderNumber]/
  await page.waitForURL(/\/order\/[^/]+\/?$/, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const m = page.url().match(/\/order\/([^/]+)\/?$/);
  if (!m) { await shot(page, '04-sin-ordernumber'); throw new Error(`no se pudo extraer orderNumber de ${page.url()}`); }
  const orderNumber = decodeURIComponent(m[1]);
  await shot(page, `04-confirmacion-${orderNumber}`);
  log(`✓ orden creada: ${orderNumber}`);
  return orderNumber;
}

/** Crea una orden de PRODUCTO FÍSICO por la UI (checkout E2E real). */
async function crearOrdenB2C() {
  return conSesion(async (page) => { await agregarProductoFisico(page); return checkoutYPagar(page); });
}

/** Crea una orden de SERVICIO de lavado por la UI (wizard → checkout E2E real).
 *  El checkout del servicio SOLO ofrece Tarjeta (verificado s20) → forzamos tarjeta;
 *  si pidieron transferencia/efectivo, caemos a crédito con un aviso. */
async function crearOrdenServicioB2C() {
  const pagoServicio = PAGO === 'debito' ? 'debito' : 'credito';
  if (PAGO !== pagoServicio) log(`servicio solo admite tarjeta → ignorando CAPA2_PAGO=${PAGO}, uso ${pagoServicio}`);
  return conSesion(async (page) => { await agregarServicioLavado(page); return checkoutYPagar(page, pagoServicio); });
}

/**
 * Marca el checkbox de T&C con click REAL (CDP). En Qwik el.click() de JS no sincroniza
 * el signal → el botón siderúrgico ("Iniciar compra"/"Pagar") queda disabled. Busca el
 * checkbox por su rol; si no, por el input adyacente al texto de T&C.
 */
async function aceptarTyC(page, ctx) {
  // Candidatos: checkbox por rol, o input[type=checkbox] cerca del texto de T&C.
  const porRol = page.getByRole('checkbox').first();
  let target = porRol;
  if (await porRol.count() === 0) {
    target = page.locator('input[type="checkbox"]').first();
  }
  try {
    if (await target.isChecked().catch(() => false)) return;
    await target.scrollIntoViewIfNeeded();
    await target.click();             // CDP real
    await page.waitForTimeout(400);
    if (!await target.isChecked().catch(() => true)) {
      // fallback: click sobre el label/texto
      await page.getByText(/Acepto los T[eé]rminos/i).first().click().catch(() => {});
    }
  } catch (e) {
    log(`aceptarTyC(${ctx}): ${e.message}`);
  }
}

module.exports = { crearOrdenB2C, crearOrdenServicioB2C, checkoutYPagar };

// CLI — despacha por CAPA2_TIPO ('fisico' default | 'servicio') y CAPA2_PAGO
// ('credito' default | 'debito' | 'transferencia' | 'efectivo').
//   node scripts/crear-orden-b2c.js                                  → físico, tarjeta crédito
//   CAPA2_TIPO=servicio node scripts/crear-orden-b2c.js              → servicio (wizard), tarjeta
//   CAPA2_PAGO=efectivo node scripts/crear-orden-b2c.js             → físico, "Generar pedido" efectivo
//   CAPA2_PAGO=transferencia node scripts/crear-orden-b2c.js        → físico, "Generar pedido" SPEI
if (require.main === module) {
  const crear = TIPO === 'servicio' ? crearOrdenServicioB2C : crearOrdenB2C;
  log(`creando orden tipo: ${TIPO} · pago: ${PAGO}`);
  crear()
    .then((orderNumber) => {
      // ÚNICA salida a stdout (parseable): CAPA2_ORDER=...
      console.log(`CAPA2_ORDER=${orderNumber}`);
      process.exit(0);
    })
    .catch((e) => { log(`ERROR: ${e.message}`); process.exit(1); });
}
