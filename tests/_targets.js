// tests/contracts/b2c/_targets.js
// FUENTE ÚNICA DE VERDAD de los checks post-liberación B2C.
//
// Aquí vive la SELECCIÓN de DATOS que comparte la suite:
//   - HEALTH_URLS   → las URLs que la Capa 0 verifica (200).
//   - PRODUCTO      → el SKU de prueba de la ruta del dinero.
//   - COBERTURA_SEED→ el fixture de localStorage que hace la PDP determinista.
// Cuando el sitio cambie A PROPÓSITO una URL o el producto de prueba, se edita
// AQUÍ y en ningún otro lado.
//
// ⚠️ Los SELECTORES de cada contract NO viven aquí: están co-localizados en su
// propio spec (1-global-layout, 1-home, 1-pdp…), junto a la aserción que valen.
// Es deliberado — para una suite pequeña, leer el selector al lado del assert es
// más claro que rastrearlo en un objeto de config central. Centralizamos URLs y
// fixtures (que sí se repiten); no los selectores (que no).
//
// Criterio de inclusión (ver ADR en overview.md F6): solo entra lo load-bearing
// de la ruta del dinero + cuenta + cascarón global. Riesgo = Impacto × Probabilidad.
// Regla de selectores (en cada spec): roles ARIA + texto + href de producto.
// Nunca clases hash de Qwik (ver SELECTOR_STABILITY en _helpers).

const BASE = process.env.B2C_BASE_URL || 'https://qarotoplasmx.io';
const abs = (path) => new URL(path, BASE).toString();

// ─────────────────────────────────────────────────────────────────────────
// PRODUCTO DE PRUEBA + FIXTURE DE COBERTURA
// El B2C resuelve disponibilidad por CP y guarda el resultado en localStorage
// (`coverage_<CP>` por SKU + `user_addr`). En un contexto limpio de Playwright
// no existe → la PDP pediría CP y deshabilitaría la compra. Sembramos el mínimo
// (solo el SKU bajo prueba) para que la PDP sea DETERMINISTA. Verificado en vivo
// 2026-06-07 vía DevTools. Es un fixture controlado, no datos reales del usuario.
// ─────────────────────────────────────────────────────────────────────────
const PRODUCTO = {
  nombre: 'Base para tinaco GDPV',
  sku: '310002',
  slug: '/product/BASE-PARA-TINACO/',
  cp: '02800',
};

const COBERTURA_SEED = {
  // localStorage key → valor (string JSON, tal como lo guarda el sitio)
  [`coverage_${PRODUCTO.cp}`]: JSON.stringify({
    [PRODUCTO.sku]: {
      coverage: true, cp: '02300', id_sucursal: 130020498,
      id_distribuidor: 1001371, costo_envio: '200.00',
    },
  }),
  user_addr: JSON.stringify({
    composed: 'Camarones 155k, Col. Nueva Santa María, Ciudad de México, Ciudad de México, C.P. 02800',
    alias: 'Casa', manual: true,
    fields: {
      streetName: 'Camarones', streetNumber: '155k', noInt: '',
      postalCode: '02800', building: 'Nueva Santa María',
      city: 'Ciudad de México', region: 'Azcapotzalco',
      state: 'Ciudad de México', additionalAddressInfo: '',
    },
    extraInfo: '', coords: null,
  }),
};

// ─────────────────────────────────────────────────────────────────────────
// SERVICIO DE LAVADO — wizard de cotización + compra (/servicios-lavado/).
// El trigger "Cotizar lavado" es una <img> Builder.io (NO un botón de texto) →
// se ancla por el hash del ASSET (estable entre builds, a diferencia de las clases
// q-* de Qwik). Su variante A/B (BUG-B2C-457) se sirve por hash del builderVisitorId
// → pinear uno conocido-bueno fija la variante CON wizard. Si aún así no aparece,
// el contract hace SKIP (no fail) — es presencia condicional, no regresión.
// Verificado E2E s20 (orden 6122026VSX6C, SKU 452308). Ver inventario II.16.c/d.
// ─────────────────────────────────────────────────────────────────────────
const SERVICIO = {
  slug: '/servicios-lavado/',
  triggerAsset: 'a634cf17',  // hash del asset Builder.io del trigger "Cotizar lavado"
  builderVisitor: process.env.B2C_BUILDER_VISITOR || 'fc50bc243814433baf628a1bf231ca18',
  sku: '452308',             // "Mantenimiento Tinaco" — line-item .service-card en /cart
};

// ─────────────────────────────────────────────────────────────────────────
// CAPA 0 · HEALTH — URLs críticas que DEBEN responder 200 tras un deploy.
// Solo la columna vertebral pública. Confirmadas como existentes en el inventario.
// ⚠️ /traking/ es la correcta; /tracking/ da error (BUG-B2C-097) → NO incluir esa.
// ─────────────────────────────────────────────────────────────────────────
const HEALTH_URLS = [
  // Entrada + auth
  { nombre: 'Home', url: abs('/') },
  { nombre: 'Login', url: abs('/login') },
  { nombre: 'Signup', url: abs('/signup') },                              // /registro/ NO funciona (BUG-056)
  { nombre: 'Forgot password', url: abs('/forgot-password/') },
  // Las 7 plantillas de categoría (una por template; los 947 productos comparten plantilla PDP)
  { nombre: 'Categoría — Almacenamiento', url: abs('/products/almacenamiento/') },
  { nombre: 'Categoría — Almacenamiento Especializado', url: abs('/products/almacenamiento-especializado/') },
  { nombre: 'Categoría — Presurización', url: abs('/products/presurizacion/') },
  { nombre: 'Categoría — Purificación', url: abs('/products/purificacion/') },
  { nombre: 'Categoría — Tratamiento', url: abs('/products/tratamiento/') },
  { nombre: 'Categoría — Calentamiento', url: abs('/products/calentamiento/') },
  { nombre: 'Categoría — Conducción', url: abs('/products/conduccion/') },
  // PDP representativa (plantilla de producto)
  { nombre: 'PDP (plantilla)', url: abs('/product/BASE-PARA-TINACO/') },
  // Ruta transaccional
  { nombre: 'Carrito', url: abs('/cart/') },
  { nombre: 'Checkout paso 1', url: abs('/checkout/1/') },
  // Servicios clave
  { nombre: 'Seguimiento de pedido', url: abs('/traking/') },            // /tracking/ da error (BUG-097)
  { nombre: 'Contacto', url: abs('/contacto/') },
];

module.exports = {
  BASE, abs, HEALTH_URLS,
  PRODUCTO, COBERTURA_SEED,
  SERVICIO,
};
