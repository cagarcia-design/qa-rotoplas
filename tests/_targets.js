// tests/_targets.js
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
// El slug de la PDP difiere por ambiente: QA usa el slug "limpio" en mayúsculas,
// mientras que PROD lo sirve como Nombre-con-guiones_SKU. El slug QA en prod
// redirige a /producto-no-disponible/ (200, pero NO es la PDP) → verificado en vivo
// 2026-06-16. Se elige por hostname para que el contract apunte a la PDP real en
// cada ambiente. Si el catálogo cambia el SKU de prueba, se edita aquí y nada más.
const IS_PROD = /rotoplas\.com\.mx/i.test(BASE);
const PRODUCTO = {
  nombre: 'Base para tinaco GDPV',
  sku: '310002',
  slug: IS_PROD ? '/product/Base-para-tinaco_310002/' : '/product/BASE-PARA-TINACO/',
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
// ÁREAS DEL SITIO — eje organizador del panel (rediseño 2026-06-19).
// El panel agrupa TODO por área del sitio (un solo hogar por concepto). Cada
// HEALTH_URL declara a qué área pertenece → el panel puede correr la dimensión
// "Responde" (200 + render) recortada POR ÁREA, en vez de un bloque monolítico.
// Las claves DEBEN coincidir con las de AREAS en scripts/dashboard.js.
//   cascaron · home · pdp · servicios · institucional · compra · cuenta
// ─────────────────────────────────────────────────────────────────────────
const AREA = {
  CASCARON: 'cascaron', HOME: 'home', PDP: 'pdp', SERVICIOS: 'servicios',
  INSTITUCIONAL: 'institucional', COMPRA: 'compra', CUENTA: 'cuenta',
};

// ─────────────────────────────────────────────────────────────────────────
// CAPA 0 · HEALTH — URLs críticas que DEBEN responder 200 tras un deploy.
// Solo la columna vertebral pública. Confirmadas como existentes en el inventario.
// ⚠️ /traking/ es la correcta; /tracking/ da error (BUG-B2C-097) → NO incluir esa.
// Cada entrada lleva `area` → el panel llena la celda "Responde" de cada área.
// ─────────────────────────────────────────────────────────────────────────
const HEALTH_URLS = [
  // Entrada
  { nombre: 'Home', url: abs('/'), area: AREA.HOME },
  // Mi cuenta (entrada / auth)
  { nombre: 'Login', url: abs('/login'), area: AREA.CUENTA },
  { nombre: 'Signup', url: abs('/signup'), area: AREA.CUENTA },           // /registro/ NO funciona (BUG-056)
  { nombre: 'Forgot password', url: abs('/forgot-password/'), area: AREA.CUENTA },
  // Las 7 plantillas de categoría (una por template; los 947 productos comparten plantilla PDP)
  { nombre: 'Categoría — Almacenamiento', url: abs('/products/almacenamiento/'), area: AREA.PDP },
  { nombre: 'Categoría — Almacenamiento Especializado', url: abs('/products/almacenamiento-especializado/'), area: AREA.PDP },
  { nombre: 'Categoría — Presurización', url: abs('/products/presurizacion/'), area: AREA.PDP },
  { nombre: 'Categoría — Purificación', url: abs('/products/purificacion/'), area: AREA.PDP },
  { nombre: 'Categoría — Tratamiento', url: abs('/products/tratamiento/'), area: AREA.PDP },
  { nombre: 'Categoría — Calentamiento', url: abs('/products/calentamiento/'), area: AREA.PDP },
  { nombre: 'Categoría — Conducción', url: abs('/products/conduccion/'), area: AREA.PDP },
  // NOTA (s26): la PDP NO va en HEALTH_URLS a propósito. Antes apuntaba al slug FIJO
  // del SKU 310002 → si el catálogo lo da de baja, health+content daban rojo (falso
  // "regresión", que en realidad es cambio de datos). La cobertura "una PDP responde y
  // renderiza" la da ahora `1-catalog.contract.spec.js` DINÁMICAMENTE (primer producto de
  // la categoría, sin SKU fijo). El único punto con SKU fijo es `1-pdp` (deliberado: la
  // cobertura sembrada por CP lo hace determinista para asertar precio + botón habilitado).
  // Servicios — hub + landing del servicio comprable (ambos llenan Responde de Servicios)
  { nombre: 'Servicios — hub', url: abs('/servicios/'), area: AREA.SERVICIOS },
  { nombre: 'Servicios — Lavado', url: abs('/servicios-lavado/'), area: AREA.SERVICIOS },
  // Compra (ruta transaccional + post-venta). Seguimiento es ANÓNIMO (sin auth): se
  // entra con número de pedido. Vive en Compra (post-venta), NO en Mi cuenta (auth).
  { nombre: 'Carrito', url: abs('/cart/'), area: AREA.COMPRA },
  { nombre: 'Checkout paso 1', url: abs('/checkout/1/'), area: AREA.COMPRA },
  { nombre: 'Seguimiento de pedido', url: abs('/traking/'), area: AREA.COMPRA },   // /tracking/ da error (BUG-097)
  // Institucional / Contenido — toda página que el área posee tiene su check 200
  // (simetría con Estructura: antes solo /contacto/ estaba aquí → FAQ/distribuidores/
  // legales podían dar 404 tras un deploy y Responde seguía verde).
  { nombre: 'Contacto', url: abs('/contacto/'), area: AREA.INSTITUCIONAL },
  { nombre: 'Preguntas frecuentes', url: abs('/preguntas-frecuentes/'), area: AREA.INSTITUCIONAL },
  { nombre: 'Distribuidores', url: abs('/distribuidores/'), area: AREA.INSTITUCIONAL },
  { nombre: 'Aviso de privacidad', url: abs('/aviso-de-privacidad/'), area: AREA.INSTITUCIONAL },
  { nombre: 'Seguridad de la información', url: abs('/seguridad-de-la-informacion/'), area: AREA.INSTITUCIONAL },
  // Contenido editorial/corporativo (adoptado por Institucional — auditoría taxonomía s29).
  { nombre: 'Nosotros', url: abs('/nosotros/'), area: AREA.INSTITUCIONAL },
  { nombre: 'Blog', url: abs('/blog/'), area: AREA.INSTITUCIONAL },
  { nombre: 'Recursos', url: abs('/recursos/'), area: AREA.INSTITUCIONAL },
];

// Vista de HEALTH_URLS recortada por área. El panel corre "Responde" de un área
// pasando DASH_AREA=<clave> al spawn → este helper deja solo las URLs de esa área.
// Sin DASH_AREA (o 'all') devuelve todas → comportamiento monolítico de siempre.
// Es deliberado que viva aquí (fuente única) y no en cada spec.
function healthUrls() {
  const a = process.env.DASH_AREA;
  if (!a || a === 'all') return HEALTH_URLS;
  return HEALTH_URLS.filter((u) => u.area === a);
}

module.exports = {
  BASE, abs, HEALTH_URLS, healthUrls, AREA,
  PRODUCTO, COBERTURA_SEED,
  SERVICIO,
};
