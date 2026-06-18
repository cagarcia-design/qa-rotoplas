// tests/3-money-path-purchase.smoke.spec.js
// CAPA 2 (N2 · EFECTO REAL) — RUTA DEL DINERO COMPLETA: la compra se concreta.
//
// QUÉ CIERRA: el #1 del diagnóstico de profundidad (COBERTURA). 2-money-path recorre
// PDP→carrito→checkout 1/2/3 pero NUNCA pulsa "Pagar" → se queda a un paso del dinero.
// ESTE spec completa la compra de verdad y verifica el EFECTO: se generó una orden con
// número válido. Es la diferencia entre "el checkout renderiza" y "un cliente puede pagar".
//
// CÓMO: reusa el flujo YA PROBADO Y MANTENIDO de scripts/crear-orden-b2c.js
// (login tecleado real → PDP → carrito → checkout 3 pasos → Pagar 4242 → /order/[n]/),
// en vez de duplicar selectores frágiles del checkout. El test es un wrapper delgado de
// aserción sobre ese flujo: si la compra se concreta, devuelve el orderNumber.
//
// PROD-SAFETY: crea una ORDEN REAL → QA-only (en prod la creación de órdenes está
// bloqueada por PROD_BLOCKED en el dashboard). Skip limpio en prod.
//
// MUTANTE → on-demand, NO en el run rápido: tag @smoke (check:b2c lo excluye).
//   Correr: npm run check:b2c:purchase
//
// Tag: @smoke @auth @purchase

const { test, expect } = require('./_helpers');
const { crearOrdenB2C } = require('../scripts/crear-orden-b2c');

const IS_PROD = /rotoplas\.com\.mx/i.test(process.env.B2C_BASE_URL || '');

test.describe('@smoke @auth @purchase Ruta del dinero COMPLETA — compra hasta orden creada', () => {
  test.skip(IS_PROD, 'Crea una orden REAL → QA-only. En prod la creación de órdenes está bloqueada.');

  test('Compra E2E (login→PDP→carrito→checkout→Pagar) genera un nº de orden válido', async () => {
    // El flujo E2E con login tecleado + checkout 3 pasos + pago sandbox tarda;
    // damos margen amplio (el script ya tiene sus propios settles de Qwik).
    test.setTimeout(180_000);

    const orderNumber = await crearOrdenB2C();

    // EFECTO load-bearing: la compra produjo un número de orden.
    expect(orderNumber, 'el checkout no devolvió orderNumber → la compra no se concretó').toBeTruthy();
    // Formato de orden B2C: 7 dígitos + sufijo alfanumérico (ej. 6162026BCY8L).
    // NO son 10 dígitos seguidos (eso sería otro identificador). Ver inventario §9.
    expect(
      orderNumber,
      `orderNumber "${orderNumber}" no tiene el formato esperado \\d{7}[A-Z0-9]{3,}`
    ).toMatch(/^\d{7}[A-Z0-9]{3,}$/);

    console.log('@@ORDER_CREATED ' + JSON.stringify({ orderNumber, env: 'qa' }));
  });
});
