// tests/2-pci-baseline.contract.spec.js
// CAPA 1 · BASELINE EJECUTABLE — guard de compliance PCI (autenticado).
//
// QUÉ VIGILA: BUG-B2C-119 (CRÍTICO seg/compliance) — el detalle de pedido muestra en
// "Datos de pago" los ÚLTIMOS 6 DÍGITOS del PAN (`**********424242`). PCI-DSS Req. 3.3/3.4
// permite mostrar a lo sumo los últimos 4. Es violación de compliance (riesgo legal).
//
// POR QUÉ UN GUARD (expected-fail) Y NO UN BUG MÁS EN LA LISTA: hoy el bug existe →
// este test FALLA a propósito (bugConocido lo marca expected-fail → verde en el reporte).
// Su valor es la SEÑAL DE CAMBIO: si alguien ARREGLA el enmascarado (≤4 dígitos) el test
// pasará inesperadamente → Playwright lo marca como "unexpected pass" → cerramos BUG-119.
// Si EMPEORA (expone aún más), el assert lo seguirá delatando. Ver ADR "baseline ejecutable".
//
// INVARIANTE DESEADO: ningún texto de la página revela 5+ dígitos tras el enmascarado
//   (regex /\*{2,}\d{5,}/ → "****12345" viola; "****1234" cumple). Verificado en vivo
//   2026-06-18 sobre el pedido 6182026A9KJ5: "Datos de pago … **********424242".
//
// ROBUSTO sin hardcodear un pedido: extrae números de orden REALES de /customer/orders
// (la lista no usa <a href>, BUG IDOR-style aparte; los nº van como texto) y arma la URL
// de detalle /customer/orders/{n}/ (patrón verificado). Evalúa solo pedidos con TARJETA
// (los de efectivo/transferencia no exponen PAN).
//
// Tag: @contract @auth

const path = require('path');
const fs = require('fs');
const { test, expect, irA, bugConocido, scrollAlFondo } = require('./_helpers');

const AUTH_FILE = path.resolve(__dirname, '../rotoplas-auth-b2c.json');
const HAY_SESION = fs.existsSync(AUTH_FILE);
if (HAY_SESION) test.use({ storageState: AUTH_FILE });

test.describe('@contract @auth Baseline PCI — exposición del PAN en detalle de pedido', () => {
  test.skip(!HAY_SESION, 'Sin sesión B2C (rotoplas-auth-b2c.json). Corre `npm run auth:b2c`. No es regresión del sitio.');
  test.describe.configure({ mode: 'serial' });

  bugConocido(test, 'BUG-B2C-119',
    'El detalle de pedido NO debe revelar más de los últimos 4 dígitos del PAN (hoy muestra 6: **********424242 → viola PCI-DSS 3.3/3.4)',
    async ({ page }) => {
      await irA(page, '/customer/orders');
      await scrollAlFondo(page);

      // Números de orden reales desde la lista (formato \d{7}[A-Z0-9]{3,}, ej. 6182026A9KJ5).
      const lista = await page.evaluate(() => document.body.innerText);
      const nums = [...new Set(lista.match(/\b\d{7}[A-Z0-9]{3,}\b/g) || [])];
      expect(nums.length, 'no se encontraron pedidos en /customer/orders para evaluar').toBeGreaterThan(0);

      let evaluado = false;
      for (const n of nums.slice(0, 6)) {
        await irA(page, `/customer/orders/${n}/`);
        const detalle = await page.evaluate(() => document.body.innerText);
        if (!/tarjeta/i.test(detalle)) continue; // solo tarjeta expone PAN
        evaluado = true;
        // INVARIANTE DESEADO (PCI): a lo sumo 4 dígitos tras el enmascarado.
        expect(detalle, `PAN sobre-expuesto en pedido ${n} (PCI-DSS)`).not.toMatch(/\*{2,}\d{5,}/);
      }
      expect(evaluado, 'ningún pedido con pago por TARJETA disponible para evaluar el PAN').toBeTruthy();
    });
});
